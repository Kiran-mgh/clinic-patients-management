import { Injectable, BadRequestException, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { OtpSession } from '../entities/otp-session.entity';

import { SmsService } from './sms.service';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OtpSession)
    private otpSessionRepository: Repository<OtpSession>,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async onModuleInit() {
    // Seed authorized doctors from environment whitelist on startup
    const doctorsEnv = process.env.AUTHORIZED_DOCTORS || '';
    if (doctorsEnv) {
      const doctorNumbers = doctorsEnv.split(',').map((num) => num.trim());
      for (const mobileNumber of doctorNumbers) {
        if (!mobileNumber) continue;
        const existing = await this.userRepository.findOne({ where: { mobileNumber } });
        if (!existing) {
          const newDoc = this.userRepository.create({
            mobileNumber,
            role: 'doctor',
          });
          await this.userRepository.save(newDoc);
          console.log(`[SEED] Pre-registered doctor mobile number: ${mobileNumber}`);
        } else if (existing.role === 'patient') {
          // Promote existing user to doctor if they are added to the whitelist
          existing.role = 'doctor';
          await this.userRepository.save(existing);
          console.log(`[SEED] Promoted existing user to doctor: ${mobileNumber}`);
        }
      }
    }
  }

  async requestOtp(mobileNumber: string, isStaff?: boolean): Promise<string> {
    if (!mobileNumber) {
      throw new BadRequestException('Mobile number is required');
    }

    const trimmed = mobileNumber.trim();
    const isAdminBypass = trimmed === '+919999999999' || trimmed === '9999999999';

    // 1. Staff Validation: If accessing portal, verify the user is a pre-registered doctor or admin
    if (isStaff && !isAdminBypass) {
      const user = await this.userRepository.findOne({ where: { mobileNumber: trimmed } });
      if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
        throw new BadRequestException('This mobile number is not registered as clinic staff.');
      }
    }

    // Special test bypass for admin login
    if (isAdminBypass) {
      return '000000';
    }

    // Generate 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration

    const otpSession = this.otpSessionRepository.create({
      mobileNumber,
      otpCode,
      expiresAt,
      verified: false,
    });

    await this.otpSessionRepository.save(otpSession);

    // Send via SMS service (MSG91 / Twilio / Mock)
    await this.smsService.sendOtp(trimmed, otpCode);

    return otpCode;
  }

  async verifyOtp(mobileNumber: string, otpCode: string): Promise<{ accessToken: string; isNewUser: boolean; user: any }> {
    if (!mobileNumber || !otpCode) {
      throw new BadRequestException('Mobile number and OTP code are required');
    }

    let isValid = false;
    let role = 'patient';

    // Special admin bypass check
    if ((mobileNumber === '+919999999999' || mobileNumber === '9999999999') && otpCode === '000000') {
      isValid = true;
      role = 'admin';
    } else {
      const session = await this.otpSessionRepository.findOne({
        where: { mobileNumber, otpCode, verified: false },
        order: { createdAt: 'DESC' },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid OTP code');
      }

      if (new Date() > session.expiresAt) {
        throw new UnauthorizedException('OTP code has expired');
      }

      session.verified = true;
      await this.otpSessionRepository.save(session);
      isValid = true;
    }

    if (!isValid) {
      throw new UnauthorizedException('Verification failed');
    }

    // Check if user exists
    let user = await this.userRepository.findOne({ where: { mobileNumber }, relations: ['patient'] });
    let isNewUser = false;

    if (!user) {
      user = this.userRepository.create({
        mobileNumber,
        role,
      });
      user = await this.userRepository.save(user);
      isNewUser = true;
    } else if (role === 'admin' && user.role !== 'admin') {
      // Force admin role if using the admin number
      user.role = 'admin';
      user = await this.userRepository.save(user);
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      isNewUser: isNewUser || !user.patient,
      user: {
        id: user.id,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    };
  }
}
