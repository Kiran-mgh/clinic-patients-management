import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { AppController } from './app.controller';

// Entities
import { User } from './entities/user.entity';
import { Patient } from './entities/patient.entity';
import { Token } from './entities/token.entity';
import { OtpSession } from './entities/otp-session.entity';
import { AuditLog } from './entities/audit-log.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { TreatmentCourse } from './entities/treatment-course.entity';
import { CoursePayment } from './entities/course-payment.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { TokensModule } from './tokens/tokens.module';
import { QueueModule } from './queue/queue.module';
import { SettingsModule } from './settings/settings.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<number>('DB_PORT', 5432);
        const dbUsername = configService.get<string>('DB_USERNAME') || configService.get<string>('DB_USER');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        const dbName = configService.get<string>('DB_DATABASE') || configService.get<string>('DB_NAME');

        if (dbHost) {
          // PostgreSQL production config
          return {
            type: 'postgres',
            host: dbHost,
            port: dbPort,
            username: dbUsername,
            password: dbPassword,
            database: dbName,
            entities: [User, Patient, Token, OtpSession, AuditLog, SystemSetting, TreatmentCourse, CoursePayment],
            synchronize: true, // Set false and use migrations in strict production
          };
        } else {
          // Development SQLite fallback
          return {
            type: 'sqlite',
            database: 'amar_hospital.sqlite',
            entities: [User, Patient, Token, OtpSession, AuditLog, SystemSetting, TreatmentCourse, CoursePayment],
            synchronize: true,
          };
        }
      },
    }),
    AuthModule,
    PatientsModule,
    TokensModule,
    QueueModule,
    SettingsModule,
    BillingModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
