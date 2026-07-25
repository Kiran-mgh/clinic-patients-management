import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly sessionMap = new Map<string, string>();

  async sendOtp(mobileNumber: string): Promise<string> {
    const provider = process.env.SMS_PROVIDER || 'mock';
    const cleanMobile = mobileNumber.replace('+', '').trim();

    if (provider === 'mock') {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      this.logger.log(`[SMS OTP MOCK] Sent to ${mobileNumber}: ${otpCode}`);
      return otpCode;
    }

    if (provider === 'msg91') {
      const authKey = process.env.MSG91_AUTH_KEY;
      const templateId = process.env.MSG91_TEMPLATE_ID;

      try {
        const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanMobile}&authkey=${authKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
        });

        if (!response.ok) {
          const bodyText = await response.text();
          this.logger.error(`MSG91 OTP API returned error status ${response.status}: ${bodyText}`);
          throw new BadRequestException('Failed to request verification code');
        }

        const resData = await response.json();
        if (resData.type === 'error') {
          this.logger.error(`MSG91 OTP send failed: ${resData.message}`);
          throw new BadRequestException(`Verification request failed: ${resData.message}`);
        }

        this.logger.log(`MSG91 OTP sent successfully via OTP API to ${mobileNumber}`);
        return 'sent_via_msg91';
      } catch (err: any) {
        this.logger.error(`Failed to send MSG91 OTP: ${err.message}`);
        throw new BadRequestException(err.message || 'Failed to send verification code');
      }
    }

    if (provider === 'firebase') {
      const apiKey = process.env.FIREBASE_WEB_API_KEY || process.env.FIREBASE_API_KEY;
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
          throw new BadRequestException('Failed to send verification SMS via Firebase');
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

    return '';
  }

  async verifyOtp(mobileNumber: string, otpCode: string): Promise<boolean> {
    const provider = process.env.SMS_PROVIDER || 'mock';
    const cleanMobile = mobileNumber.replace('+', '').trim();

    if (provider === 'mock') {
      return true;
    }

    if (provider === 'firebase') {
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

    if (provider === 'msg91') {
      const authKey = process.env.MSG91_AUTH_KEY;

      try {
        const url = `https://control.msg91.com/api/v5/otp/verify?authkey=${authKey}&mobile=${cleanMobile}&otp=${otpCode}`;
        
        const response = await fetch(url, {
          method: 'POST',
        });

        if (!response.ok) {
          const bodyText = await response.text();
          this.logger.error(`MSG91 OTP Verify API returned error status ${response.status}: ${bodyText}`);
          return false;
        }

        const resData = await response.json();
        if (resData.type === 'success') {
          this.logger.log(`MSG91 OTP verified successfully for ${mobileNumber}`);
          return true;
        } else {
          this.logger.warn(`MSG91 OTP verification failed for ${mobileNumber}: ${resData.message}`);
          return false;
        }
      } catch (err: any) {
        this.logger.error(`Failed to verify MSG91 OTP: ${err.message}`);
        return false;
      }
    }

    return false;
  }
}
