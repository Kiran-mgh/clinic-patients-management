import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendOtp(mobileNumber: string, otpCode: string): Promise<boolean> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    const formattedPhone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    if (!accessToken || !phoneNumberId) {
      this.logger.warn(`WhatsApp credentials missing in .env (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID). Falling back to mock WhatsApp output.`);
      this.logger.log(`[WHATSAPP OTP SIMULATOR] Sent to +${formattedPhone}: ${otpCode}`);
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: `🏥 *Amar Hospital Verification Code*\n\nYour 6-digit OTP code is: *${otpCode}*\n\nValid for 5 minutes. Please do not share this code with anyone.`,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const bodyText = await response.text();
        this.logger.error(`Meta WhatsApp API returned error ${response.status}: ${bodyText}`);
        throw new BadRequestException(`Failed to dispatch WhatsApp OTP: ${bodyText}`);
      }

      const resData = await response.json();
      this.logger.log(`WhatsApp OTP ${otpCode} sent successfully via Meta Cloud API to +${formattedPhone} (Message ID: ${resData.messages?.[0]?.id || 'ok'})`);
      return true;
    } catch (err: any) {
      this.logger.error(`WhatsApp OTP dispatch error: ${err.message}`);
      throw new BadRequestException(err.message || 'Failed to dispatch WhatsApp OTP');
    }
  }
}
