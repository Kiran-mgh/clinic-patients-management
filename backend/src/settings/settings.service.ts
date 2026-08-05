import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { QueueGateway } from '../queue/queue.gateway';

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

  async getTokenSettings(): Promise<{ startTime: string; endTime: string; enabled: boolean }> {
    const startTime = await this.getSetting('token_start_time', '07:00');
    const endTime = await this.getSetting('token_end_time', '15:30');
    const enabledStr = await this.getSetting('token_generation_enabled', 'true');

    return {
      startTime,
      endTime,
      enabled: enabledStr === 'true',
    };
  }

  async updateTokenSettings(
    adminId: string,
    data: { startTime?: string; endTime?: string; enabled?: boolean },
  ): Promise<{ startTime: string; endTime: string; enabled: boolean }> {
    if (data.startTime) {
      await this.setSetting('token_start_time', data.startTime);
    }
    if (data.endTime) {
      await this.setSetting('token_end_time', data.endTime);
    }
    if (data.enabled !== undefined) {
      await this.setSetting('token_generation_enabled', data.enabled ? 'true' : 'false');
    }

    // Broadcast real-time update
    this.queueGateway.emitQueueUpdate();

    return this.getTokenSettings();
  }
}
