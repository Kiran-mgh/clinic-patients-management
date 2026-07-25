import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly sessionMap = new Map<string, string>();

  async sendOtp(mobileNumber: string): Promise<string> {
    const provider = (process.env.SMS_PROVIDER || 'firebase').trim().toLowerCase();
    const cleanMobile = mobileNumber.replace('+', '').trim();

    if (provider === 'mock') {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      this.logger.log(`[SMS OTP MOCK] Sent to ${mobileNumber}: ${otpCode}`);
      return otpCode;
    }

    const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      this.logger.error('FIREBASE_WEB_API_KEY is not configured in .env');
      throw new BadRequestException('FIREBASE_WEB_API_KEY is missing on server');
    }

    const formattedPhone = mobileNumber.startsWith('+') ? mobileNumber : `+91${cleanMobile}`;
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        this.logger.error(`Firebase Identity Toolkit returned error ${response.status}: ${bodyText}`);
        let parsedMsg = 'Failed to send verification SMS via Firebase';
        try {
          const parsed = JSON.parse(bodyText);
          if (parsed?.error?.message) {
            parsedMsg += ` (${parsed.error.message})`;
          }
        } catch (e) {}
        throw new BadRequestException(parsedMsg);
      }

      const resData = await response.json();
      if (resData.sessionInfo) {
        this.sessionMap.set(cleanMobile, resData.sessionInfo);
      }
      this.logger.log(`Firebase SMS OTP dispatched successfully to ${formattedPhone}`);
      return resData.sessionInfo || 'sent_via_firebase';
    } catch (err: any) {
      this.logger.error(`Failed to send Firebase SMS: ${err.message}`);
      throw new BadRequestException(err.message || 'Failed to send verification code via Firebase');
    }
  }

  async verifyOtp(mobileNumber: string, otpCode: string): Promise<boolean> {
    const provider = (process.env.SMS_PROVIDER || 'firebase').trim().toLowerCase();
    const cleanMobile = mobileNumber.replace('+', '').trim();

    if (provider === 'mock') {
      return true;
    }

    const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey) {
      return false;
    }

    const sessionInfo = this.sessionMap.get(cleanMobile);
    if (!sessionInfo) {
      this.logger.warn(`No active Firebase OTP session found for ${mobileNumber}`);
      return false;
    }

    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionInfo, code: otpCode }),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        this.logger.warn(`Firebase OTP verification rejected for ${mobileNumber}: ${bodyText}`);
        return false;
      }

      const resData = await response.json();
      if (resData.idToken) {
        this.logger.log(`Firebase OTP verified successfully with Google for ${mobileNumber}`);
        this.sessionMap.delete(cleanMobile);
        return true;
      }
      return false;
    } catch (err: any) {
      this.logger.error(`Firebase OTP verification error: ${err.message}`);
      return false;
    }
  }
}
