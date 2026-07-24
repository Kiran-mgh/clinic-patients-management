import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class LoginFirebaseDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsOptional()
  @IsBoolean()
  isStaff?: boolean;
}
