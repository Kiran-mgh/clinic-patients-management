import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tokenNumber: string; // e.g. M001, T002

  @Column()
  serviceType: string; // 'medicine' | 'treatment'

  @Column({ default: 'waiting' })
  status: string; // 'waiting' | 'in_progress' | 'served' | 'cancelled' | 'expired'

  @Column({ type: 'int' })
  sequenceNumber: number; // for queue ordering

  @ManyToOne(() => Patient, (patient) => patient.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column('uuid')
  patientId: string;

  @CreateDateColumn()
  generatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  calledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  servedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 'Unpaid' })
  paymentStatus: string; // 'Paid' | 'Unpaid'

  @Column({ type: 'text', nullable: true })
  paymentNotes: string;
}
