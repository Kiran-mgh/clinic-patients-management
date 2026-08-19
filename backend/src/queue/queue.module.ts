import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';
import { Token } from '../entities/token.entity';
import { Patient } from '../entities/patient.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, Patient, AuditLog, SystemSetting]),
    NotificationsModule,
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueGateway],
  exports: [QueueService, QueueGateway],
})
export class QueueModule {}
