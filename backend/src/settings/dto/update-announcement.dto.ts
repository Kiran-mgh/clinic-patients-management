import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['vacation', 'holiday', 'emergency', 'general'])
  type?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  autoPauseTokens?: boolean;
}
