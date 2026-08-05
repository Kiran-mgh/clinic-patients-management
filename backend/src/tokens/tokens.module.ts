import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { QueueModule } from '../queue/queue.module';
import { SettingsModule } from '../settings/settings.module';
import { Token } from '../entities/token.entity';
import { Patient } from '../entities/patient.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, Patient, AuditLog]),
    QueueModule,
    SettingsModule,
  ],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
