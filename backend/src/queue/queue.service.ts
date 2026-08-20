import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In, Between } from 'typeorm';
import { Token } from '../entities/token.entity';
import { Patient } from '../entities/patient.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { QueueGateway } from './queue.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    private queueGateway: QueueGateway,
    private notificationsService: NotificationsService,
  ) {}

  private getStartOfTodayIST(): Date {
    const now = new Date();
    try {
      const istDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
      const istDateStr = istDateFormatter.format(now);
      const [y, m, d] = istDateStr.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const utcMs = typeof Date.UTC === 'function' ? Date.UTC(y, m - 1, d, 0, 0, 0) : new Date(y, m - 1, d).getTime();
        return new Date(utcMs - (5.5 * 60 * 60 * 1000));
      }
    } catch (e) {
      // Fallback
    }
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  async getPublicLiveQueue(): Promise<any> {
    const startOfToday = this.getStartOfTodayIST();

    const activeMedicineToken = await this.tokenRepository.findOne({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'medicine',
        status: 'in_progress',
      },
    });

    const activeTreatmentToken = await this.tokenRepository.findOne({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'treatment',
        status: 'in_progress',
      },
    });

    const waitingMedicineTokens = await this.tokenRepository.find({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'medicine',
        status: 'waiting',
      },
      order: { sequenceNumber: 'ASC' },
      take: 8,
    });

    const waitingTreatmentTokens = await this.tokenRepository.find({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'treatment',
        status: 'waiting',
      },
      order: { sequenceNumber: 'ASC' },
      take: 8,
    });

    const recentServedTokens = await this.tokenRepository.find({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        status: 'served',
      },
      order: { servedAt: 'DESC' },
      take: 5,
    });

    const medicineWaitingCount = await this.tokenRepository.count({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'medicine',
        status: 'waiting',
      },
    });

    const treatmentWaitingCount = await this.tokenRepository.count({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'treatment',
        status: 'waiting',
      },
    });

    let announcement = null;
    try {
      const setting = await this.systemSettingRepository.findOne({ where: { key: 'clinic_announcement' } });
      if (setting && setting.value) {
        announcement = JSON.parse(setting.value);
      }
    } catch (e) {}

    return {
      currentServingMedicine: activeMedicineToken ? activeMedicineToken.tokenNumber : null,
      currentServingTreatment: activeTreatmentToken ? activeTreatmentToken.tokenNumber : null,
      medicineCalledAt: activeMedicineToken?.calledAt || null,
      treatmentCalledAt: activeTreatmentToken?.calledAt || null,
      medicineWaitingCount,
      treatmentWaitingCount,
      waitingMedicineTokens: waitingMedicineTokens.map(t => t.tokenNumber),
      waitingTreatmentTokens: waitingTreatmentTokens.map(t => t.tokenNumber),
      recentServedTokens: recentServedTokens.map(t => ({
        tokenNumber: t.tokenNumber,
        serviceType: t.serviceType,
        servedAt: t.servedAt,
      })),
      announcement: announcement && announcement.enabled ? announcement : null,
      serverTime: new Date().toISOString(),
    };
  }

  async getDashboardMetrics(): Promise<any> {
    const startOfToday = this.getStartOfTodayIST();

    const totalPatients = await this.tokenRepository.count({
      where: { generatedAt: MoreThanOrEqual(startOfToday) },
    });

    const activeTokens = await this.tokenRepository.count({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        status: In(['waiting', 'in_progress']),
      },
    });

    const servedTokens = await this.tokenRepository.count({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        status: 'served',
      },
    });

    const cancelledTokens = await this.tokenRepository.count({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        status: 'cancelled',
      },
    });

    const pendingApprovalsCount = await this.patientRepository.count({
      where: { status: In(['pending_approval', 'pending_verification']) },
    });

    const currentServingMedicine = await this.tokenRepository.findOne({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'medicine',
        status: 'in_progress',
      },
    });

    const currentServingTreatment = await this.tokenRepository.findOne({
      where: {
        generatedAt: MoreThanOrEqual(startOfToday),
        serviceType: 'treatment',
        status: 'in_progress',
      },
    });

    return {
      totalPatients,
      activeTokens,
      servedTokens,
      cancelledTokens,
      pendingApprovalsCount,
      currentServingMedicine: currentServingMedicine ? currentServingMedicine.tokenNumber : 'None',
      currentServingTreatment: currentServingTreatment ? currentServingTreatment.tokenNumber : 'None',
    };
  }

  async getTodayQueue(): Promise<any[]> {
    const startOfToday = this.getStartOfTodayIST();

    const tokens = await this.tokenRepository.find({
      where: { generatedAt: MoreThanOrEqual(startOfToday) },
      relations: ['patient'],
      order: { sequenceNumber: 'ASC' },
    });

    const activeMedicineToken = tokens.find(t => t.serviceType === 'medicine' && t.status === 'in_progress');
    const activeTreatmentToken = tokens.find(t => t.serviceType === 'treatment' && t.status === 'in_progress');

    const medServingSeq = activeMedicineToken ? activeMedicineToken.sequenceNumber : 0;
    const trtServingSeq = activeTreatmentToken ? activeTreatmentToken.sequenceNumber : 0;

    return tokens.map(t => {
      const currentSeq = t.serviceType === 'medicine' ? medServingSeq : trtServingSeq;
      const isMissed = t.status === 'waiting' && currentSeq > 0 && t.sequenceNumber < currentSeq;
      return {
        ...t,
        isMissed,
        effectiveStatus: isMissed ? 'missed' : t.status,
      };
    });
  }

  async callNext(adminId: string, serviceType: string): Promise<Token> {
    if (serviceType !== 'medicine' && serviceType !== 'treatment') {
      throw new BadRequestException('Invalid service type. Must be medicine or treatment.');
    }

    const now = new Date();
    const startOfToday = this.getStartOfTodayIST();

    // 1. Automatically mark any currently in_progress token of this type as served
    const currentActiveToken = await this.tokenRepository.findOne({
      where: {
        serviceType,
        status: 'in_progress',
        generatedAt: MoreThanOrEqual(startOfToday),
      },
    });

    if (currentActiveToken) {
      currentActiveToken.status = 'served';
      currentActiveToken.servedAt = now;
      await this.tokenRepository.save(currentActiveToken);
      await this.logAction(adminId, 'TOKEN_SERVE_AUTO', `Auto-served token ${currentActiveToken.tokenNumber} on calling next`);
    }

    // 2. Find next waiting token today (lowest sequence number)
    const nextToken = await this.tokenRepository.findOne({
      where: {
        serviceType,
        status: 'waiting',
        generatedAt: MoreThanOrEqual(startOfToday),
      },
      order: { sequenceNumber: 'ASC' },
    });

    if (!nextToken) {
      throw new BadRequestException(`No waiting patients in the ${serviceType} queue today.`);
    }

    nextToken.status = 'in_progress';
    nextToken.calledAt = now;
    const updatedToken = await this.tokenRepository.save(nextToken);

    await this.logAction(adminId, 'TOKEN_CALL_NEXT', `Called token ${updatedToken.tokenNumber} for ${serviceType}`);

    // Dispatch push notifications asynchronously
    const roomName = serviceType === 'medicine' ? 'Doctor Consultation Room 1' : 'Treatment Room';
    
    // 1. Send "Now Serving" alert to the called patient
    this.notificationsService.sendToPatient(
      updatedToken.patientId,
      `🔔 It's Your Turn! (Token ${updatedToken.tokenNumber})`,
      `Token ${updatedToken.tokenNumber}: Please proceed to ${roomName} now.`,
      { type: 'TOKEN_CALLED', tokenNumber: updatedToken.tokenNumber, serviceType },
    ).catch(err => console.error(`[PUSH ERROR] Failed to send token call push: ${err.message}`));

    // 2. Send "Approaching Turn" alerts to the next 5 waiting patients
    const serviceName = serviceType === 'medicine' ? 'Medicine Consultation' : 'Treatment';
    this.tokenRepository.find({
      where: {
        serviceType,
        status: 'waiting',
        generatedAt: MoreThanOrEqual(startOfToday),
      },
      order: { sequenceNumber: 'ASC' },
      take: 5,
    }).then(upcoming => {
      upcoming.forEach((tok, index) => {
        const spotsAhead = index + 1; // 1 to 5

        // Skip 3rd and 4th spot notifications as requested
        if (![1, 2, 5].includes(spotsAhead)) {
          return;
        }

        let title = '';
        let body = '';

        if (spotsAhead === 1) {
          title = `⏳ You are Next! (Token ${tok.tokenNumber})`;
          body = `Token ${tok.tokenNumber}: The doctor is now serving Token ${updatedToken.tokenNumber}. You are next in line.`;
        } else {
          title = `⏳ Turn Approaching (Token ${tok.tokenNumber})`;
          body = `Token ${tok.tokenNumber}: ${spotsAhead} patients ahead for ${serviceName}.`;
        }

        this.notificationsService.sendToPatient(
          tok.patientId,
          title,
          body,
          { type: `QUEUE_AHEAD_${spotsAhead}`, tokenNumber: tok.tokenNumber, spotsAhead },
        ).catch(() => {});
      });
    }).catch(() => {});

    // Broadcast real-time update
    this.queueGateway.emitQueueUpdate();

    return updatedToken;
  }

  async updateTokenStatus(
    adminId: string,
    id: string,
    status: string,
    notes?: string,
    paymentStatus?: string,
    paymentNotes?: string,
  ): Promise<Token> {
    if (!['served', 'cancelled', 'waiting', 'in_progress'].includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    const token = await this.tokenRepository.findOne({ where: { id }, relations: ['patient'] });
    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const now = new Date();
    token.status = status;

    if (notes !== undefined) {
      token.notes = notes;
    }
    if (paymentStatus !== undefined) {
      token.paymentStatus = paymentStatus;
    }
    if (paymentNotes !== undefined) {
      token.paymentNotes = paymentNotes;
    }

    if (status === 'in_progress') {
      token.calledAt = now;
      const roomName = token.serviceType === 'medicine' ? 'Doctor Consultation Room 1' : 'Treatment Room';
      this.notificationsService.sendToPatient(
        token.patientId,
        `🔔 It's Your Turn! (Token ${token.tokenNumber})`,
        `Token ${token.tokenNumber}: Please proceed to ${roomName} now.`,
        { type: 'TOKEN_CALLED', tokenNumber: token.tokenNumber, serviceType: token.serviceType },
      ).catch(err => console.error(`[PUSH ERROR] Failed to send token call push: ${err.message}`));
    } else if (status === 'served') {
      token.servedAt = now;
    } else if (status === 'cancelled') {
      token.cancelledAt = now;
    }

    const updatedToken = await this.tokenRepository.save(token);

    await this.logAction(adminId, `TOKEN_${status.toUpperCase()}`, `Manually marked token ${token.tokenNumber} as ${status}`);

    // Broadcast real-time update
    this.queueGateway.emitQueueUpdate();

    return updatedToken;
  }

  async updateTokenPayment(
    adminId: string,
    id: string,
    paymentStatus: string,
    paymentNotes?: string,
  ): Promise<Token> {
    if (!['Paid', 'Unpaid'].includes(paymentStatus)) {
      throw new BadRequestException('Invalid payment status value');
    }

    const token = await this.tokenRepository.findOne({ where: { id }, relations: ['patient'] });
    if (!token) {
      throw new NotFoundException('Token not found');
    }

    token.paymentStatus = paymentStatus;
    if (paymentNotes !== undefined) {
      token.paymentNotes = paymentNotes;
    }

    const updatedToken = await this.tokenRepository.save(token);

    await this.logAction(adminId, 'TOKEN_PAYMENT_UPDATE', `Updated payment status of token ${token.tokenNumber} to ${paymentStatus}`);

    // Broadcast real-time update
    this.queueGateway.emitQueueUpdate();

    return updatedToken;
  }

  async getReports(startDateStr: string, endDateStr: string): Promise<any> {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    const tokens = await this.tokenRepository.find({
      where: {
        generatedAt: Between(start, end),
        status: 'served',
      },
      relations: ['patient', 'patient.user'],
      order: { generatedAt: 'DESC' },
    });

    const newPatients = await this.patientRepository.find({
      where: {
        createdAt: Between(start, end),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const medicineCount = tokens.filter(t => t.serviceType === 'medicine').length;
    const treatmentCount = tokens.filter(t => t.serviceType === 'treatment').length;
    const totalCount = tokens.length;

    // Monthly breakdown
    const monthlyMap = new Map<string, { month: string; monthName: string; medicine: number; treatment: number; newPatients: number; total: number }>();
    
    for (const token of tokens) {
      const date = new Date(token.generatedAt);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          monthName: monthKey,
          medicine: 0,
          treatment: 0,
          newPatients: 0,
          total: 0,
        });
      }
      const monthData = monthlyMap.get(monthKey)!;
      monthData.total++;
      if (token.serviceType === 'medicine') {
        monthData.medicine++;
      } else if (token.serviceType === 'treatment') {
        monthData.treatment++;
      }
    }

    for (const patient of newPatients) {
      const date = new Date(patient.createdAt);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          monthName: monthKey,
          medicine: 0,
          treatment: 0,
          newPatients: 0,
          total: 0,
        });
      }
      const monthData = monthlyMap.get(monthKey)!;
      monthData.newPatients++;
    }

    const monthlyBreakdown = Array.from(monthlyMap.values());

    return {
      summary: {
        medicineCount,
        treatmentCount,
        totalCount,
        newPatientsCount: newPatients.length,
      },
      monthlyBreakdown,
      visits: tokens.map(t => ({
        tokenId: t.id,
        tokenNumber: t.tokenNumber,
        serviceType: t.serviceType,
        status: t.status,
        date: t.generatedAt,
        patientDbId: t.patient?.id || '',
        patientId: t.patient?.patientId || t.patient?.id || '',
        patientCustomId: t.patient?.patientId || '',
        patientName: t.patient?.fullName || '',
        patientPhone: t.patient?.user?.mobileNumber || '',
        notes: t.notes || '',
        servingNotes: t.notes || '',
        paymentStatus: t.paymentStatus || 'Unpaid',
        paymentNotes: t.paymentNotes || '',
        paymentDisplay: (t.paymentStatus || 'Unpaid') + (t.paymentNotes ? ` (${t.paymentNotes})` : ''),
      })),
      newPatients: newPatients.map(p => ({
        id: p.id,
        patientId: p.patientId || 'Pending Approval',
        fullName: p.fullName,
        mobileNumber: p.user?.mobileNumber || '',
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        town: p.town,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }

  private async logAction(userId: string, action: string, details: string) {
    const log = this.auditLogRepository.create({
      userId,
      action,
      details,
    });
    await this.auditLogRepository.save(log);
  }
}
