import { IsOptional, IsString, IsBoolean, IsArray, IsNumber } from 'class-validator';

export class UpdateTokenSettingsDto {
  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  medicineAllowedDays?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  treatmentAllowedDays?: number[];
}
