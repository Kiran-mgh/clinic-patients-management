import { IsNotEmpty, Matches, IsOptional, IsBoolean } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty({ message: 'Mobile number is required' })
  @Matches(/^(\d{10}|\+919999999999)$/, {
    message: 'Mobile number must be exactly 10 digits.',
  })
  mobileNumber: string;

  @IsOptional()
  @IsBoolean()
  isStaff?: boolean;
}
