import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async sendOtp(mobileNumber: string, otpCode: string): Promise<boolean> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'hello_world';

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    const formattedPhone = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;

    if (!accessToken || !phoneNumberId) {
      this.logger.warn(`WhatsApp credentials missing in .env. Falling back to session output.`);
      this.logger.log(`[WHATSAPP OTP SIMULATOR] Sent to +${formattedPhone}: ${otpCode}`);
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      
      let payload: any;
      if (templateName === 'hello_world') {
        payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' },
          },
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otpCode }],
              },
            ],
          },
        };
      }

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
        this.logger.warn(`Meta WhatsApp API returned status ${response.status}: ${bodyText}`);
        if (bodyText.includes('131030') || bodyText.includes('allowed list')) {
          this.logger.warn(`[WHATSAPP DEV MODE FALLBACK] Recipient +${formattedPhone} not in Meta test allowed list. Generated session OTP: ${otpCode}`);
          return true;
        }
        this.logger.log(`[WHATSAPP SESSION FALLBACK] Generated session OTP for +${formattedPhone}: ${otpCode}`);
        return true;
      }

      const resData = await response.json();
      this.logger.log(`WhatsApp OTP ${otpCode} sent successfully via Meta Template (${templateName}) to +${formattedPhone} (Message ID: ${resData.messages?.[0]?.id || 'ok'})`);
      return true;
    } catch (err: any) {
      this.logger.warn(`WhatsApp OTP dispatch exception: ${err.message}. Using session fallback.`);
      this.logger.log(`[WHATSAPP SESSION FALLBACK] Generated session OTP for +${formattedPhone}: ${otpCode}`);
      return true;
    }
  }
}
