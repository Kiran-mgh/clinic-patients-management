import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { QueueGateway } from '../queue/queue.gateway';

export interface TokenSettingsResponse {
  startTime: string;
  endTime: string;
  saturdayStartTime: string;
  saturdayEndTime: string;
  enabled: boolean;
  medicineAllowedDays: number[];
  treatmentAllowedDays: number[];
}

export interface AnnouncementResponse {
  enabled: boolean;
  type: string; // 'vacation' | 'holiday' | 'emergency' | 'general'
  title: string;
  message: string;
  startDate: string;
  endDate: string;
  autoPauseTokens: boolean;
  updatedAt?: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private settingsRepository: Repository<SystemSetting>,
    private queueGateway: QueueGateway,
  ) {}

  async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      return defaultValue;
    }
    return setting.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepository.create({ key, value });
    } else {
      setting.value = value;
    }
    await this.settingsRepository.save(setting);
  }

  async getTokenSettings(): Promise<TokenSettingsResponse> {
    const startTime = await this.getSetting('token_start_time', '07:00');
    const endTime = await this.getSetting('token_end_time', '15:30');
    const saturdayStartTime = await this.getSetting('saturday_token_start_time', '07:30');
    const saturdayEndTime = await this.getSetting('saturday_token_end_time', '13:00');
    const enabledStr = await this.getSetting('token_generation_enabled', 'true');
    const medDaysStr = await this.getSetting('medicine_allowed_days', '1,2,3,4,5,6');
    const treatDaysStr = await this.getSetting('treatment_allowed_days', '2,3,4');

    const medicineAllowedDays = medDaysStr ? medDaysStr.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d)) : [1, 2, 3, 4, 5, 6];
    const treatmentAllowedDays = treatDaysStr ? treatDaysStr.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d)) : [2, 3, 4];

    return {
      startTime,
      endTime,
      saturdayStartTime,
      saturdayEndTime,
      enabled: enabledStr === 'true',
      medicineAllowedDays,
      treatmentAllowedDays,
    };
  }

  async updateTokenSettings(
    adminId: string,
    data: {
      startTime?: string;
      endTime?: string;
      saturdayStartTime?: string;
      saturdayEndTime?: string;
      enabled?: boolean;
      medicineAllowedDays?: number[];
      treatmentAllowedDays?: number[];
    },
  ): Promise<TokenSettingsResponse> {
    if (data.startTime) {
      await this.setSetting('token_start_time', data.startTime);
    }
    if (data.endTime) {
      await this.setSetting('token_end_time', data.endTime);
    }
    if (data.saturdayStartTime) {
      await this.setSetting('saturday_token_start_time', data.saturdayStartTime);
    }
    if (data.saturdayEndTime) {
      await this.setSetting('saturday_token_end_time', data.saturdayEndTime);
    }
    if (data.enabled !== undefined) {
      await this.setSetting('token_generation_enabled', data.enabled ? 'true' : 'false');
    }
    if (data.medicineAllowedDays) {
      await this.setSetting('medicine_allowed_days', data.medicineAllowedDays.join(','));
    }
    if (data.treatmentAllowedDays) {
      await this.setSetting('treatment_allowed_days', data.treatmentAllowedDays.join(','));
    }

    // Broadcast real-time update
    this.queueGateway.emitQueueUpdate();

    return this.getTokenSettings();
  }

  async getAnnouncement(): Promise<AnnouncementResponse> {
    const raw = await this.getSetting('clinic_announcement', '');
    if (!raw) {
      return {
        enabled: false,
        type: 'vacation',
        title: '',
        message: '',
        startDate: '',
        endDate: '',
        autoPauseTokens: false,
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        enabled: false,
        type: 'vacation',
        title: '',
        message: '',
        startDate: '',
        endDate: '',
        autoPauseTokens: false,
      };
    }
  }

  async updateAnnouncement(data: {
    enabled?: boolean;
    type?: string;
    title?: string;
    message?: string;
    startDate?: string;
    endDate?: string;
    autoPauseTokens?: boolean;
  }): Promise<AnnouncementResponse> {
    const current = await this.getAnnouncement();
    const updated: AnnouncementResponse = {
      enabled: data.enabled !== undefined ? data.enabled : current.enabled,
      type: data.type || current.type || 'vacation',
      title: data.title !== undefined ? data.title : current.title,
      message: data.message !== undefined ? data.message : current.message,
      startDate: data.startDate !== undefined ? data.startDate : current.startDate,
      endDate: data.endDate !== undefined ? data.endDate : current.endDate,
      autoPauseTokens: data.autoPauseTokens !== undefined ? data.autoPauseTokens : current.autoPauseTokens,
      updatedAt: new Date().toISOString(),
    };

    await this.setSetting('clinic_announcement', JSON.stringify(updated));

    // Broadcast real-time update to all connected web and mobile clients
    this.queueGateway.emitQueueUpdate();

    return updated;
  }
}
