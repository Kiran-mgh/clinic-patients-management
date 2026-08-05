import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In, Between } from 'typeorm';
import { Token } from '../entities/token.entity';
import { Patient } from '../entities/patient.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { QueueGateway } from './queue.gateway';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private queueGateway: QueueGateway,
  ) {}

  async getDashboardMetrics(): Promise<any> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

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

    if (status === 'served') {
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
      relations: ['patient'],
      order: { generatedAt: 'DESC' },
    });

    const newPatients = await this.patientRepository.find({
      where: {
        createdAt: Between(start, end),
      },
      order: { createdAt: 'DESC' },
    });

    const medicineCount = tokens.filter(t => t.serviceType === 'medicine').length;
    const treatmentCount = tokens.filter(t => t.serviceType === 'treatment').length;
    const totalCount = tokens.length;

    // Monthly breakdown
    const monthlyMap = new Map<string, { month: string; medicine: number; treatment: number; total: number }>();
    
    for (const token of tokens) {
      const date = new Date(token.generatedAt);
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          medicine: 0,
          treatment: 0,
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
        patientId: t.patient?.id || '',
        patientName: t.patient?.fullName || '',
        patientCustomId: t.patient?.patientId || '',
        notes: t.notes || '',
        paymentStatus: t.paymentStatus || 'Unpaid',
        paymentNotes: t.paymentNotes || '',
        paymentDisplay: (t.paymentStatus || 'Unpaid') + (t.paymentNotes ? ` (${t.paymentNotes})` : ''),
      })),
      newPatients: newPatients.map(p => ({
        id: p.id,
        patientId: p.patientId || 'Pending Approval',
        fullName: p.fullName,
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
