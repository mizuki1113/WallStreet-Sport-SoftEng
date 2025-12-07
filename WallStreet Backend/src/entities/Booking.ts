import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Transaction } from './Transaction';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'booking_reference' })
  bookingReference: string;

  // Customer info
  @Column({ name: 'customer_name' })
  customerName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  // Booking date
  @Column({ type: 'date', name: 'booking_date' })
  bookingDate: string | Date;

  // 🔹 NEW: multi-slot support
  @Column('text', { name: 'time_slots', array: true, nullable: true })
  timeSlots: string[];

  @Column({ type: 'jsonb', name: 'slot_details', nullable: true })
  slotDetails: {
    time: string;
    displayTime: string;
    rate: number;
    period: string;
  }[];

  @Column('decimal', {
    precision: 10,
    scale: 2,
    name: 'total_rate',
    default: 0,
  })
  totalRate: number;

  // 🔸 Legacy single-slot fields (kept for backward compatibility)
  @Column({ name: 'time_slot', nullable: true })
  timeSlot: string;

  @Column({ name: 'display_time', nullable: true })
  displayTime: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  rate: number;

  @Column({ nullable: true })
  period: string;

  // Status
  @Column({ default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => Transaction, transaction => transaction.booking)
  transactions: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'email_sent', default: false })
  emailSent: boolean;
}
