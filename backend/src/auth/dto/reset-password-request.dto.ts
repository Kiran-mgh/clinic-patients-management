import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPasswordRequestDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
