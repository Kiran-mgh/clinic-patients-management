import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as https from "https";
import { Patient } from "../entities/patient.entity";

export interface PushNotificationPayload {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  /**
   * Helper to check if a string is a valid Expo Push Token
   */
  private isExpoPushToken(token: string): boolean {
    if (!token || typeof token !== "string") return false;
    return (
      /^(ExponentPushToken|ExpoPushToken)\[.*\]$/.test(token) ||
      /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i.test(token) ||
      token.length > 15
    );
  }

  /**
   * Send a single push notification to a patient by their patient UUID
   */
  async sendToPatient(
    patientId: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<boolean> {
    try {
      let patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient || !patient.pushToken) {
        patient = await this.patientRepository.findOne({
          where: [{ id: patientId }, { patientId: patientId }],
        });
      }

      if (!patient || !patient.pushToken) {
        this.logger.warn(`No push token registered for patient ${patientId} (${patient?.fullName || 'Unknown'})`);
        return false;
      }

      return await this.sendToPushToken(patient.pushToken, title, body, data);
    } catch (err: any) {
      this.logger.error(`Error sending push to patient ${patientId}: ${err.message}`);
      return false;
    }
  }

  /**
   * Send push notification directly to an Expo push token
   */
  async sendToPushToken(
    pushToken: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<boolean> {
    if (!this.isExpoPushToken(pushToken)) {
      this.logger.warn(`Invalid Expo push token: ${pushToken}`);
      return false;
    }

    const message: PushNotificationPayload = {
      to: pushToken,
      sound: "default",
      title,
      body,
      data: { ...data, timestamp: new Date().toISOString() },
      channelId: "clinic-queue",
      priority: "high",
    };

    return await this.postToExpoPushApi([message]);
  }

  /**
   * Batch send push notifications to multiple patients (e.g. queue alerts, notices)
   */
  async sendToPatients(
    patientIds: string[],
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<number> {
    try {
      const patients = await this.patientRepository.findByIds(patientIds);
      const validTokens = patients
        .map((p) => p.pushToken)
        .filter((tok): tok is string => Boolean(tok && this.isExpoPushToken(tok)));

      if (validTokens.length === 0) return 0;

      const messages: PushNotificationPayload[] = validTokens.map((to) => ({
        to,
        sound: "default",
        title,
        body,
        data: { ...data, timestamp: new Date().toISOString() },
        channelId: "clinic-queue",
        priority: "high",
      }));

      const success = await this.postToExpoPushApi(messages);
      return success ? messages.length : 0;
    } catch (err: any) {
      this.logger.error(`Failed to send batch push notifications: ${err.message}`);
      return 0;
    }
  }

  /**
   * Dispatches push messages via direct HTTPS POST to Expo Push API endpoint
   */
  private async postToExpoPushApi(messages: PushNotificationPayload[]): Promise<boolean> {
    if (!messages || messages.length === 0) return true;

    return new Promise((resolve) => {
      try {
        const payload = JSON.stringify(messages);
        const options: https.RequestOptions = {
          hostname: "exp.host",
          port: 443,
          path: "/--/api/v2/push/send",
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          timeout: 6000,
        };

        const req = https.request(options, (res) => {
          let responseData = "";
          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              this.logger.log(`Successfully dispatched ${messages.length} push notification(s).`);
              resolve(true);
            } else {
              this.logger.warn(`Expo push API responded with status ${res.statusCode}: ${responseData}`);
              resolve(false);
            }
          });
        });

        req.on("error", (error) => {
          this.logger.error(`HTTPS request to Expo push API failed: ${error.message}`);
          resolve(false);
        });

        req.on("timeout", () => {
          req.destroy();
          this.logger.warn("HTTPS request to Expo push API timed out.");
          resolve(false);
        });

        req.write(payload);
        req.end();
      } catch (err: any) {
        this.logger.error(`Unexpected error in postToExpoPushApi: ${err.message}`);
        resolve(false);
      }
    });
  }
}
