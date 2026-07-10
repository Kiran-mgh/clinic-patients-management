import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { RegisterPatientByStaffDto } from './dto/register-patient-by-staff.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async register(
    userId: string,
    data: {
      fullName: string;
      gender: string;
      dateOfBirth: string;
      email?: string;
      bloodGroup?: string;
      profession?: string;
      town: string;
      isExisting: boolean;
      existingPatientId?: string;
    },
  ): Promise<Patient> {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['patient'] });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.patient) {
      throw new BadRequestException('Patient profile already exists for this user');
    }

    let status = 'pending_approval';
    if (data.isExisting && !data.existingPatientId) {
      status = 'pending_verification'; // Case 2: Existing patient without Patient ID
    }

    const patient = this.patientRepository.create({
      id: userId,
      fullName: data.fullName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
      bloodGroup: data.bloodGroup,
      profession: data.profession,
      town: data.town,
      isExisting: data.isExisting,
      patientId: data.isExisting ? data.existingPatientId : null,
      status,
    });

    const savedPatient = await this.patientRepository.save(patient);

    // Audit log
    await this.logAction(
      userId,
      'PATIENT_REGISTER',
      `Registered profile for ${data.fullName}. Status: ${status}. IsExisting: ${data.isExisting}`,
    );

    return savedPatient;
  }

  async createPatientByStaff(adminId: string, data: RegisterPatientByStaffDto): Promise<Patient> {
    // 1. Find or create the user with this mobile number
    let user = await this.userRepository.findOne({ where: { mobileNumber: data.mobileNumber }, relations: ['patient'] });
    if (!user) {
      user = this.userRepository.create({
        mobileNumber: data.mobileNumber,
        role: 'patient',
      });
      user = await this.userRepository.save(user);
    } else if (user.patient) {
      throw new BadRequestException('Patient profile already exists for this mobile number');
    }

    // 2. Determine status and Patient ID
    let status = 'active'; // Immediate activation since staff registers the record
    let patientId = data.isExisting ? data.existingPatientId : null;

    if (!patientId && !data.isExisting) {
      patientId = await this.generateNextPatientId();
    }

    // 3. Create the patient profile linked to that user
    const patient = this.patientRepository.create({
      id: user.id,
      fullName: data.fullName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
      bloodGroup: data.bloodGroup,
      profession: data.profession,
      town: data.town,
      isExisting: data.isExisting,
      patientId,
      status,
    });

    const savedPatient = await this.patientRepository.save(patient);

    // Audit log
    await this.logAction(
      adminId,
      'PATIENT_CREATE_BY_STAFF',
      `Staff ${adminId} created patient profile for ${data.fullName} (${user.id}). Assigned ID: ${patientId}`,
    );

    return savedPatient;
  }

  async getProfile(userId: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: userId },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  async getPendingApprovals(): Promise<Patient[]> {
    return this.patientRepository.find({
      where: [
        { status: 'pending_approval' },
        { status: 'pending_verification' }
      ],
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async approvePatient(adminId: string, id: string, customPatientId?: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.status === 'active') {
      throw new BadRequestException('Patient is already active');
    }

    let finalPatientId = customPatientId || patient.patientId;

    // Generate consecutive ID if none exists or provided
    if (!finalPatientId) {
      finalPatientId = await this.generateNextPatientId();
    }

    patient.patientId = finalPatientId;
    patient.status = 'active';

    const updatedPatient = await this.patientRepository.save(patient);

    // Audit log
    await this.logAction(
      adminId,
      'PATIENT_APPROVE',
      `Approved patient ${patient.fullName} (${patient.id}). Assigned ID: ${finalPatientId}`,
    );

    return updatedPatient;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    if (!query) {
      return this.patientRepository.find({
        relations: ['user'],
        order: { fullName: 'ASC' }
      });
    }

    // Try finding matching mobile in user table, or match in patient table
    return this.patientRepository.createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .where('patient.fullName ILIKE :query', { query: `%${query}%` })
      .orWhere('patient.patientId ILIKE :query', { query: `%${query}%` })
      .orWhere('user.mobileNumber ILIKE :query', { query: `%${query}%` })
      .getMany();
  }

  private async generateNextPatientId(): Promise<string> {
    // Find highest patientId matching AH%
    const lastPatient = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.patientId LIKE :pattern', { pattern: 'AH%' })
      .orderBy('patient.patientId', 'DESC')
      .getOne();

    if (!lastPatient || !lastPatient.patientId) {
      return 'AH000001';
    }

    const numberPart = lastPatient.patientId.replace('AH', '');
    const currentNumber = parseInt(numberPart, 10);
    if (isNaN(currentNumber)) {
      return 'AH000001';
    }

    const nextNumber = currentNumber + 1;
    const padded = nextNumber.toString().padStart(6, '0');
    return `AH${padded}`;
  }

  async getPatientDetail(id: string): Promise<any> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['user', 'tokens'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Sort tokens by generation date descending (latest first)
    if (patient.tokens) {
      patient.tokens.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }

    return patient;
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
