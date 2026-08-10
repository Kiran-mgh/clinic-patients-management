import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Patient } from './patient.entity';
import { CoursePayment } from './course-payment.entity';

@Entity('treatment_courses')
export class TreatmentCourse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  patientId: string;

  @ManyToOne(() => Patient, (patient) => patient.treatmentCourses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  title: string; // e.g. "Piles Treatment Package", "General Consultation Course"

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalFee: number;

  @Index()
  @Column({ default: 'active' })
  status: string; // 'active' | 'completed' | 'cancelled'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => CoursePayment, (payment) => payment.course)
  payments: CoursePayment[];

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
