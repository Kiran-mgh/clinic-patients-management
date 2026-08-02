import { IsNotEmpty, IsEmail, IsOptional, IsBoolean, Matches } from 'class-validator';

export class RegisterPatientDto {
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @IsNotEmpty({ message: 'Gender is required' })
  gender: string;

  @IsNotEmpty({ message: 'Date of birth is required' })
  @Matches(/^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})$/, { message: 'Date of birth must match DD/MM/YYYY format' })
  dateOfBirth: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  email?: string;

  @IsOptional()
  bloodGroup?: string;

  @IsOptional()
  profession?: string;

  @IsNotEmpty({ message: 'Town is required' })
  town: string;

  @IsBoolean()
  isExisting: boolean;

  @IsOptional()
  existingPatientId?: string;

  @IsOptional()
  previousSurgeryDetails?: string;
}
