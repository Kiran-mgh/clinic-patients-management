import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateTreatmentCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalFee?: number;

  @IsString()
  @IsOptional()
  status?: string; // 'active' | 'completed' | 'cancelled'

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  startDate?: string;
}
