import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, User, AuditLog]),
    QueueModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
