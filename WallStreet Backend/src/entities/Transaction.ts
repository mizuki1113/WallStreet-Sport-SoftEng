import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './Booking';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, booking => booking.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'gcash_transaction_id', nullable: true })
  gcashTransactionId?: string;

  @Column({ unique: true, name: 'provider_reference' })
  providerReference: string;

  @Column({ type: 'text', name: 'checkout_url', nullable: true })
  checkoutUrl?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'initiated' })
  status: 'initiated' | 'success' | 'failed';

  @Column({ name: 'payment_method', default: 'gcash' })
  paymentMethod: string;

  @Column({ type: 'timestamp', name: 'payment_date', nullable: true })
  paymentDate?: Date;

  // New columns for QR code payment flow
  @Column({ name: 'reference_number', nullable: true })
  referenceNumber?: string;

  @Column({ type: 'text', name: 'screenshot_path', nullable: true })
  screenshotPath?: string;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy?: string;

  @Column({ type: 'timestamp', name: 'verified_at', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}