import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendOtp(mobileNumber: string, otpCode: string): Promise<boolean> {
    const provider = process.env.SMS_PROVIDER || 'mock';

    if (provider === 'mock') {
      this.logger.log(`[SMS OTP MOCK] Sent to ${mobileNumber}: ${otpCode}`);
      return true;
    }

    if (provider === 'msg91') {
      const authKey = process.env.MSG91_AUTH_KEY;
      const templateId = process.env.MSG91_TEMPLATE_ID;
      const sender = process.env.MSG91_SENDER_ID;
      
      // MSG91 OTP API expects mobile number with country code, without leading '+'
      const cleanMobile = mobileNumber.replace('+', '').trim();

      try {
        const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanMobile}&authkey=${authKey}&otp=${otpCode}${sender ? `&sender=${sender}` : ''}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const bodyText = await response.text();
          this.logger.error(`MSG91 API returned error status ${response.status}: ${bodyText}`);
          return false;
        }

        const resData = await response.json();
        if (resData.type === 'error') {
          this.logger.error(`MSG91 OTP send failed: ${resData.message}`);
          return false;
        }

        this.logger.log(`MSG91 OTP sent successfully to ${mobileNumber}`);
        return true;
      } catch (err: any) {
        this.logger.error(`Failed to send MSG91 OTP: ${err.message}`);
        return false;
      }
    }

    return false;
  }
}
