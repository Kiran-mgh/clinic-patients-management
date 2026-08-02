import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Token } from './token.entity';

@Entity('patients')
export class Patient {
  @PrimaryColumn('uuid')
  id: string; // matches user.id

  @Column({ unique: true, nullable: true })
  patientId: string; // e.g., 'AH000001', assigned after approval

  @Column()
  fullName: string;

  @Column()
  gender: string;

  @Column({ type: 'date' })
  dateOfBirth: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  bloodGroup: string;

  @Column({ nullable: true })
  profession: string;

  @Column()
  town: string;

  @Column({ type: 'text', nullable: true })
  previousSurgeryDetails: string;

  @Column({ default: 'pending_approval' })
  status: string; // 'pending_approval' | 'pending_verification' | 'active'

  @Column({ default: false })
  isExisting: boolean;

  @OneToOne(() => User, (user) => user.patient)
  @JoinColumn({ name: 'id' })
  user: User;

  @OneToMany(() => Token, (token) => token.patient)
  tokens: Token[];

  @CreateDateColumn()
  createdAt: Date;
}
