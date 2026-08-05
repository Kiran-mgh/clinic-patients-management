import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Token } from '../entities/token.entity';
import { Patient } from '../entities/patient.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { QueueGateway } from '../queue/queue.gateway';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectDataSource()
    private dataSource: DataSource,
    private queueGateway: QueueGateway,
    private settingsService: SettingsService,
  ) {}

  async generateToken(userId: string, serviceType: string): Promise<Token> {
    // 1. Verify patient is active
    const patient = await this.patientRepository.findOne({ where: { id: userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found. Please register first.');
    }

    if (patient.status !== 'active') {
      throw new BadRequestException(
        'Your registration is under verification. You will be able to generate tokens once your Patient ID has been assigned by the clinic.'
      );
    }

    if (serviceType !== 'medicine' && serviceType !== 'treatment') {
      throw new BadRequestException('Invalid service type. Must be medicine or treatment.');
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 2. Dynamic Token Generation Timing (Default: 7:00 AM to 3:30 PM)
    const tokenSettings = await this.settingsService.getTokenSettings();
    if (!tokenSettings.enabled) {
      throw new BadRequestException('Token generation is currently paused by the clinic.');
    }

    const [startH, startM] = tokenSettings.startTime.split(':').map(Number);
    const [endH, endM] = tokenSettings.endTime.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      throw new BadRequestException(
        `Token generation is available only between ${tokenSettings.startTime} and ${tokenSettings.endTime}.`
      );
    }

    // 3. Dynamic Day Availability Validation
    const dayOfWeek = now.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const allowedDays = serviceType === 'medicine'
      ? (tokenSettings.medicineAllowedDays || [1, 2, 3, 4, 5, 6])
      : (tokenSettings.treatmentAllowedDays || [2, 3, 4]);

    if (!allowedDays.includes(dayOfWeek)) {
      const dayListStr = allowedDays.map(d => DAY_NAMES[d]).join(', ');
      const serviceName = serviceType === 'medicine' ? 'Medicine Consultation' : 'Treatment';
      throw new BadRequestException(
        `${serviceName} tokens are enabled only on: ${dayListStr}. (Not available today).`
      );
    }

    // 4. One Token Per Patient per day
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const existingToken = await this.tokenRepository.findOne({
      where: {
        patientId: patient.id,
        generatedAt: MoreThanOrEqual(startOfToday),
      },
    });

    if (existingToken) {
      throw new BadRequestException("You have already generated today's token.");
    }

    // 5. Calculate Sequence and Token Number (e.g. M001 or T001)
    let nextSequence: number;
    const isPostgres = this.dataSource.options.type === 'postgres';

    if (isPostgres) {
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const dateSuffix = `${year}_${month}_${day}`;
      const seqName = `${serviceType}_token_seq_${dateSuffix}`;

      // Create sequence dynamically for the current day if it does not exist
      await this.dataSource.query(`CREATE SEQUENCE IF NOT EXISTS ${seqName} START WITH 1`);
      
      // Increment and fetch next value atomically
      const result = await this.dataSource.query(`SELECT nextval('${seqName}') as val`);
      nextSequence = parseInt(result[0].val, 10);
    } else {
      // Fallback for local SQLite development
      const countToday = await this.tokenRepository.count({
        where: {
          serviceType,
          generatedAt: MoreThanOrEqual(startOfToday),
        },
      });
      nextSequence = countToday + 1;
    }

    const prefix = serviceType === 'medicine' ? 'M' : 'T';
    const paddedSequence = nextSequence.toString().padStart(3, '0');
    const tokenNumber = `${prefix}${paddedSequence}`;

    const token = this.tokenRepository.create({
      tokenNumber,
      serviceType,
      sequenceNumber: nextSequence,
      patientId: patient.id,
      status: 'waiting',
    });

    const savedToken = await this.tokenRepository.save(token);

    // Audit log
    await this.logAction(
      patient.id,
      'TOKEN_GENERATE',
      `Generated token ${tokenNumber} for ${serviceType} queue. Sequence: ${nextSequence}`,
    );

    // Broadcast real-time queue update
    this.queueGateway.emitQueueUpdate();

    return savedToken;
  }

  async getTodayToken(userId: string): Promise<any> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const token = await this.tokenRepository.findOne({
      where: {
        patientId: userId,
        generatedAt: MoreThanOrEqual(startOfToday),
      },
      order: { generatedAt: 'DESC' },
    });

    if (!token) {
      return { token: null };
    }

    // Calculate Patients Ahead: tokens of same type today, status = 'waiting' and sequence < current
    const patientsAhead = await this.tokenRepository.count({
      where: {
        serviceType: token.serviceType,
        status: 'waiting',
        generatedAt: MoreThanOrEqual(startOfToday),
        sequenceNumber: MoreThanOrEqual(1), // TypeORM operator fallback
      },
    });

    // We can refine this using query builder to get exact sequence ahead
    const exactAhead = await this.tokenRepository.createQueryBuilder('token')
      .where('token.serviceType = :serviceType', { serviceType: token.serviceType })
      .andWhere('token.status = :status', { status: 'waiting' })
      .andWhere('token.generatedAt >= :startOfToday', { startOfToday })
      .andWhere('token.sequenceNumber < :mySeq', { mySeq: token.sequenceNumber })
      .getCount();

    // Get current serving token
    const currentServingToken = await this.tokenRepository.findOne({
      where: {
        serviceType: token.serviceType,
        status: 'in_progress',
        generatedAt: MoreThanOrEqual(startOfToday),
      },
    });

    // Get latest served token if no token is currently in_progress
    const latestServedToken = await this.tokenRepository.findOne({
      where: {
        serviceType: token.serviceType,
        status: 'served',
        generatedAt: MoreThanOrEqual(startOfToday),
      },
      order: { sequenceNumber: 'DESC' },
    });

    // Get last generated token for today
    const lastGeneratedToken = await this.tokenRepository.findOne({
      where: {
        serviceType: token.serviceType,
        generatedAt: MoreThanOrEqual(startOfToday),
      },
      order: { sequenceNumber: 'DESC' },
    });

    // Get total tokens generated today for this service
    const totalTokensToday = await this.tokenRepository.count({
      where: {
        serviceType: token.serviceType,
        generatedAt: MoreThanOrEqual(startOfToday),
      },
    });

    const currentServingSeq = currentServingToken
      ? currentServingToken.sequenceNumber
      : (latestServedToken ? latestServedToken.sequenceNumber : 0);

    const isMissed = token.status === 'waiting' && token.sequenceNumber < currentServingSeq;
    const lastTokenNumber = lastGeneratedToken ? lastGeneratedToken.tokenNumber : token.tokenNumber;
    const currentServingText = currentServingToken
      ? currentServingToken.tokenNumber
      : (latestServedToken ? `Last Served: ${latestServedToken.tokenNumber}` : 'None');

    const missedMessage = isMissed
      ? `You missed your token ${token.tokenNumber}! The doctor is currently serving ${currentServingToken ? currentServingToken.tokenNumber : 'later tokens'}. Please report to the doctor or reception right after Token ${lastTokenNumber} (Last token of the session).`
      : null;

    // Estimate waiting time: 20 minutes per patient ahead
    const estimatedWaitingTimeMinutes = exactAhead * 20;

    return {
      token: {
        id: token.id,
        tokenNumber: token.tokenNumber,
        status: isMissed ? 'missed' : token.status,
        serviceType: token.serviceType,
        sequenceNumber: token.sequenceNumber,
        patientsAhead: exactAhead,
        estimatedWaitingTimeMinutes,
        currentServing: currentServingText,
        currentServingSequence: currentServingSeq,
        lastTokenNumber,
        totalTokensToday,
        isMissed,
        missedMessage,
        generatedAt: token.generatedAt,
      },
    };
  }

  async getQueueStatus(): Promise<any> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const getStatusForType = async (type: string) => {
      const currentServing = await this.tokenRepository.findOne({
        where: {
          serviceType: type,
          status: 'in_progress',
          generatedAt: MoreThanOrEqual(startOfToday),
        },
      });

      const totalWaiting = await this.tokenRepository.count({
        where: {
          serviceType: type,
          status: 'waiting',
          generatedAt: MoreThanOrEqual(startOfToday),
        },
      });

      return {
        currentServing: currentServing ? currentServing.tokenNumber : 'None',
        totalWaiting,
      };
    };

    return {
      medicine: await getStatusForType('medicine'),
      treatment: await getStatusForType('treatment'),
    };
  }

  // 6. Token Validity: automatically expire all active/waiting tokens at 5:00 PM daily
  @Cron('0 17 * * *')
  async handleDailyExpiration() {
    console.log('[CRON] Running daily token expiration reset at 5:00 PM');
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeTokens = await this.tokenRepository.createQueryBuilder('token')
      .where('token.status IN (:...statuses)', { statuses: ['waiting', 'in_progress'] })
      .andWhere('token.generatedAt >= :startOfToday', { startOfToday })
      .getMany();

    if (activeTokens.length > 0) {
      for (const token of activeTokens) {
        token.status = 'expired';
      }
      await this.tokenRepository.save(activeTokens);
      console.log(`[CRON] Expired ${activeTokens.length} active/waiting tokens`);
    }

    // Write system audit log
    await this.logAction(
      null,
      'SYSTEM_CRON_RESET',
      `Auto-expired active tokens at 5:00 PM. Total expired: ${activeTokens.length}`,
    );
  }

  private async logAction(userId: string | null, action: string, details: string) {
    const log = this.auditLogRepository.create({
      userId,
      action,
      details,
    });
    await this.auditLogRepository.save(log);
  }
}
