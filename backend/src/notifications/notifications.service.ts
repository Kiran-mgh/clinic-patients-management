import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { Patient } from "../entities/patient.entity";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo = new Expo();

  constructor(
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

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
      const patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient || !patient.pushToken) {
        this.logger.debug(`No push token registered for patient ${patientId}`);
        return false;
      }

      return await this.sendToPushToken(patient.pushToken, title, body, data);
    } catch (err) {
      this.logger.error(`Error sending push to patient ${patientId}:`, err);
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
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(`Invalid Expo push token: ${pushToken}`);
      return false;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: "default",
      title,
      body,
      data: { ...data, timestamp: new Date().toISOString() },
      channelId: "clinic-queue",
      priority: "high",
    };

    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(`Push notification sent successfully: ${title} -> ${pushToken.slice(0, 20)}...`);
      }
      return true;
    } catch (err) {
      this.logger.error("Failed to send push notification chunk:", err);
      return false;
    }
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
        .filter((tok): tok is string => Boolean(tok && Expo.isExpoPushToken(tok)));

      if (validTokens.length === 0) return 0;

      const messages: ExpoPushMessage[] = validTokens.map((to) => ({
        to,
        sound: "default",
        title,
        body,
        data: { ...data, timestamp: new Date().toISOString() },
        channelId: "clinic-queue",
        priority: "high",
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      let sentCount = 0;

      for (const chunk of chunks) {
        await this.expo.sendPushNotificationsAsync(chunk);
        sentCount += chunk.length;
      }

      this.logger.log(`Batch sent ${sentCount} push notifications: "${title}"`);
      return sentCount;
    } catch (err) {
      this.logger.error("Failed to send batch push notifications:", err);
      return 0;
    }
  }
}
