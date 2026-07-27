import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Patient } from './patient.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  mobileNumber: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  password: string;

  @Column({ default: 'patient' })
  role: string; // 'patient' | 'doctor' | 'admin'

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  resetTokenExpires: Date;

  @OneToOne(() => Patient, (patient) => patient.user, { cascade: true })
  patient: Patient;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
