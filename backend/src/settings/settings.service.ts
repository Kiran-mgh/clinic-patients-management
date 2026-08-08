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
}
