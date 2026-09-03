import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Patient } from './patient.entity';
import { TreatmentCourse } from './treatment-course.entity';

@Entity('course_payments')
export class CoursePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  patientId: string;

  @ManyToOne(() => Patient, (patient) => patient.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Index()
  @Column('uuid', { nullable: true })
  courseId: string;

  @ManyToOne(() => TreatmentCourse, (course) => course.payments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course: TreatmentCourse;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'Cash' })
  paymentMode: string; // 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Other'

  @Column({ type: 'text', nullable: true })
  transactionNotes: string; // e.g. "GPay #4492 - Advance payment"

  @Column({ nullable: true })
  recordedBy: string; // Staff or Doctor username

  @Index()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
