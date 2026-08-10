import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class RecordCoursePaymentDto {
  @IsString()
  @IsOptional()
  courseId?: string; // Optional if standalone/ad-hoc fee

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMode: string; // 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other'

  @IsString()
  @IsOptional()
  transactionNotes?: string; // e.g. "GPay Ref #4492"

  @IsString()
  @IsOptional()
  paidAt?: string; // Optional custom timestamp or ISO string
}
