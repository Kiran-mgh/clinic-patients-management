import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { Token } from '../entities/token.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { RegisterPatientByStaffDto } from './dto/register-patient-by-staff.dto';
import { QueueGateway } from '../queue/queue.gateway';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectDataSource()
    private dataSource: DataSource,
    private queueGateway: QueueGateway,
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
      previousSurgeryDetails?: string;
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
      dateOfBirth: this.parseToIsoDate(data.dateOfBirth),
      email: data.email,
      bloodGroup: data.bloodGroup,
      profession: data.profession,
      town: data.town,
      previousSurgeryDetails: data.previousSurgeryDetails,
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

    // Broadcast real-time update to web portal clients
    this.queueGateway.emitQueueUpdate();

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
      dateOfBirth: this.parseToIsoDate(data.dateOfBirth),
      email: data.email,
      bloodGroup: data.bloodGroup,
      profession: data.profession,
      town: data.town,
      previousSurgeryDetails: data.previousSurgeryDetails,
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

    // Broadcast real-time update to web portal clients
    this.queueGateway.emitQueueUpdate();

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
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['user'],
    });
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

    // Trigger automated approval email
    this.sendApprovalEmail(updatedPatient).catch(err => {
      console.error(`[APPROVAL EMAIL ERROR] Failed to send approval email: ${err.message}`);
    });

    // Audit log
    await this.logAction(
      adminId,
      'PATIENT_APPROVE',
      `Approved patient ${patient.fullName} (${patient.id}). Assigned ID: ${finalPatientId}`,
    );

    // Broadcast real-time update to web portal clients
    this.queueGateway.emitQueueUpdate();

    return updatedPatient;
  }

  private async sendApprovalEmail(patient: Patient): Promise<void> {
    const recipientEmail = patient.email || (patient.user && patient.user.email);
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.log(`[APPROVAL EMAIL SKIPPED] Patient ${patient.fullName} (ID: ${patient.patientId}) has no valid email address.`);
      return;
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const fromEmail = process.env.SMTP_FROM || smtpUser || 'no-reply@amar.vistarafabtech.com';

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const logoPath = path.join(process.cwd(), 'assets/logo.png');
        const hasLogoFile = fs.existsSync(logoPath);

        const mailOptions: any = {
          from: `"Amar Ayurveda" <${fromEmail}>`,
          to: recipientEmail,
          subject: '🎉 Your Amar Ayurveda Registration is Approved!',
          text: `Hello ${patient.fullName},\n\nGreat news! Your registration at Amar Ayurveda has been approved.\n\nYour Assigned Patient ID is: ${patient.patientId}\n\nYou can now open the Amar Ayurveda Mobile App to generate daily consultation tokens and track live queue status.\n\nClinic Address:\n#2 & 4 7th Cross, R.T. Street, Bengaluru - 560 053\nPhone: 080 - 22268269\n\nThank you for choosing Amar Ayurveda!`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 28px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f0fdf4;">
                ${hasLogoFile ? '<img src="cid:amar_logo" alt="Amar Ayurveda Logo" style="height: 36px; width: 36px; object-fit: contain; vertical-align: middle;" />' : '<span style="font-size: 20px;">🌿</span>'}
                <span style="font-size: 20px; font-weight: 800; color: #213932; letter-spacing: -0.5px; vertical-align: middle; margin-left: 10px; font-family: sans-serif;">Amar Ayurveda</span>
              </div>
              <h2 style="color: #166534; margin-top: 0; margin-bottom: 8px;">🎉 Registration Approved!</h2>
              <p style="font-size: 14px; color: #4a5568;">Dear <strong>${patient.fullName}</strong>,</p>
              <p style="font-size: 14px; color: #4a5568;">Great news! Your registration profile at <strong>Amar Ayurveda</strong> has been reviewed and approved by the clinic.</p>
              
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px 24px; text-align: center; border-radius: 12px; margin: 20px 0;">
                <span style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Your Assigned Patient ID</span>
                <span style="font-size: 32px; font-weight: 900; color: #166534; letter-spacing: 2px; font-family: monospace;">${patient.patientId}</span>
              </div>

              <p style="font-size: 14px; color: #4a5568; margin-bottom: 12px;"><strong>What you can do now:</strong></p>
              <ul style="font-size: 13px; color: #4a5568; padding-left: 20px; margin-bottom: 20px; line-height: 1.7;">
                <li>Open the <strong>Amar Ayurveda Mobile App</strong></li>
                <li>Generate daily consultation tokens for Medicine or Treatment</li>
                <li>View live queue positions and estimated waiting times</li>
              </ul>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-top: 16px;">
                <p style="margin: 0; font-size: 12px; font-weight: 700; color: #334155;">📍 Clinic Contact & Location:</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">#2 & 4 7th Cross, R.T. Street, Bengaluru - 560 053</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">📞 Phone: 080 - 22268269</p>
              </div>

              <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0 16px 0;" />
              <p style="font-size: 11px; color: #a0aec0; text-align: center; margin: 0;">Thank you for choosing Amar Ayurveda. Wish you good health!</p>
            </div>
          `,
          attachments: hasLogoFile ? [
            {
              filename: 'logo.png',
              path: logoPath,
              cid: 'amar_logo',
            },
          ] : [],
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP EMAIL SENT] Sent approval email to ${recipientEmail} with Patient ID ${patient.patientId}`);
      } catch (mailError: any) {
        console.error(`[SMTP EMAIL ERROR] Failed to send approval email to ${recipientEmail}: ${mailError.message}`);
      }
    } else {
      console.warn(`[SMTP WARN] Real SMTP credentials not set in .env. Approval email for ${patient.fullName} (${recipientEmail}) with Patient ID ${patient.patientId} logged.`);
    }
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

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      gender?: string;
      dateOfBirth?: string;
      town?: string;
      profession?: string;
      bloodGroup?: string;
      previousSurgeryDetails?: string;
    },
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: userId },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    if (data.fullName && data.fullName.trim()) {
      patient.fullName = data.fullName.trim();
      if (patient.user) {
        patient.user.name = data.fullName.trim();
        await this.userRepository.save(patient.user);
      }
    }
    if (data.gender) patient.gender = data.gender;
    if (data.dateOfBirth) patient.dateOfBirth = this.parseToIsoDate(data.dateOfBirth);
    if (data.town && data.town.trim()) patient.town = data.town.trim();
    if (data.profession !== undefined) patient.profession = data.profession ? data.profession.trim() : null;
    if (data.bloodGroup !== undefined) patient.bloodGroup = data.bloodGroup || null;
    if (data.previousSurgeryDetails !== undefined) patient.previousSurgeryDetails = data.previousSurgeryDetails ? data.previousSurgeryDetails.trim() : null;

    const savedPatient = await this.patientRepository.save(patient);

    await this.logAction(userId, 'PATIENT_UPDATE_PROFILE', `Patient ${savedPatient.fullName} updated profile details`);
    this.queueGateway.emitQueueUpdate();

    return savedPatient;
  }

  async deletePatient(adminId: string, id: string): Promise<{ message: string }> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['user', 'tokens'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const patientName = patient.fullName;
    const patientDisplayId = patient.patientId || patient.id;

    // 1. Delete associated tokens if any exist
    if (patient.tokens && patient.tokens.length > 0) {
      await this.dataSource.getRepository(Token).delete({ patientId: id });
    }

    // 2. Delete Patient profile entity
    await this.patientRepository.delete({ id });

    // 3. Delete User account entity
    if (patient.user) {
      await this.userRepository.delete({ id: patient.user.id });
    } else {
      await this.userRepository.delete({ id });
    }

    // 4. Audit Log
    await this.logAction(adminId, 'PATIENT_DELETE', `Deleted patient profile and user account for ${patientName} (${patientDisplayId})`);

    // 5. Broadcast real-time update
    this.queueGateway.emitQueueUpdate();

    return { message: `Successfully deleted patient ${patientName} (${patientDisplayId}).` };
  }

  private parseToIsoDate(dateStr: string): string {
    if (!dateStr) return dateStr;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
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
