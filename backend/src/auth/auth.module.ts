import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../entities/user.entity';
import { OtpSession } from '../entities/otp-session.entity';
import { JwtStrategy } from './jwt.strategy';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, OtpSession]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default_jwt_secret_key_123',
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') || '90d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SmsService, WhatsappService],
  exports: [AuthService, JwtModule, PassportModule, SmsService, WhatsappService],
})
export class AuthModule {}
