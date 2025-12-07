import { AppDataSource } from '../ormconfig';
import { Transaction } from '../entities/Transaction';
import { BookingService } from './BookingService';

interface InitiatePaymentDTO {
  amount: number;
  booking: {
    name: string;
    email: string;
    contact: string;
    date: string; // 'YYYY-MM-DD'
    timeSlots: {
      time: string;
      displayTime: string;
      rate: number;
      period: 'morning' | 'afternoon' | 'evening';
    }[];
  };
}

export class PaymentService {
  private txRepo = AppDataSource.getRepository(Transaction);
  private bookingService = new BookingService();

  // ✅ Called by payment.controller initiatePayment
  async initiatePayment(data: InitiatePaymentDTO) {
    const { amount, booking } = data;

    // Create booking with multiple slots
    const createdBooking = await this.bookingService.createBooking({
      name: booking.name,
      email: booking.email,
      contact: booking.contact,
      date: booking.date,
      timeSlots: booking.timeSlots,
    });

    // Create QR-based transaction
    const qr = await this.initiateQRCodePayment(createdBooking.id, amount);

    return {
      bookingId: createdBooking.id,
      bookingReference: createdBooking.bookingReference,
      transactionId: qr.transactionId,
      providerReference: qr.providerReference,
      amount,
    };
  }

  // Existing QR flow
  async initiateQRCodePayment(bookingId: string, amount: number) {
    const providerRef = `gcash_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const tx = this.txRepo.create({
      booking: { id: bookingId } as any,
      providerReference: providerRef,
      status: 'initiated',
      amount,
      paymentMethod: 'gcash',
    });
    await this.txRepo.save(tx);

    return {
      transactionId: tx.id,
      providerReference: providerRef,
      requiresProof: true,
    };
  }

  async handleGcashWebhook(payload: any) {
    const providerRef = payload.reference;
    const tx = await this.txRepo.findOne({
      where: { providerReference: providerRef },
      relations: ['booking'],
    });
    if (!tx) throw { status: 404, message: 'Transaction not found' };

    if (payload.status === 'success' || payload.status === 'COMPLETED') {
      tx.status = 'success';
      await this.txRepo.save(tx);
      if (tx.booking?.id) {
        await this.bookingService.confirmBooking(tx.booking.id);
      }
    } else {
      tx.status = 'failed';
      await this.txRepo.save(tx);
    }
    return tx;
  }

  async getTransactionById(id: string) {
    const tx = await this.txRepo.findOne({
      where: { id },
      relations: ['booking'],
    });

    if (!tx) {
      throw { status: 404, message: 'Transaction not found' };
    }

    return tx;
  }
}
