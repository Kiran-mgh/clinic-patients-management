import { IsNotEmpty, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^(\d{10}|\+919999999999)$/, {
    message: 'Mobile number must be exactly 10 digits.',
  })
  mobileNumber: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 characters.' })
  otpCode: string;
}
