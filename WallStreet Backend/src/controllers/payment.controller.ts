import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/PaymentService';
import { BookingService } from '../services/BookingService';
import { EmailService } from '../services/EmailService';
import { AppDataSource } from '../ormconfig';
import { Transaction } from '../entities/Transaction';
import path from 'path';
import fs from 'fs';

const paymentService = new PaymentService();
const bookingService = new BookingService();
const emailService = new EmailService();

export async function initiatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { amount, booking } = req.body;

    if (!amount || !booking) {
      return res.status(400).json({ error: 'Amount and booking details required' });
    }

    // Create booking first
    const newBooking = await bookingService.createBooking({
      name: booking.name,
      email: booking.email,
      contact: booking.contact,
      date: booking.date,
      timeSlot: booking.timeSlot
    });

    // Initiate payment (returns QR code flow now, not external checkout)
    const paymentResult = await paymentService.initiateQRCodePayment(newBooking.id, amount);

    res.json({
      bookingId: newBooking.id,
      bookingReference: newBooking.bookingReference,
      ...paymentResult
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadPaymentProof(req: Request, res: Response, next: NextFunction) {
  try {
    const { transactionId, referenceNumber } = req.body;
    const file = req.file;

    if (!transactionId || !referenceNumber || !file) {
      return res.status(400).json({ error: 'Transaction ID, reference number, and screenshot required' });
    }

    const txRepo = AppDataSource.getRepository(Transaction);
    const transaction = await txRepo.findOne({ 
      where: { id: transactionId },
      relations: ['booking']
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction with proof
    transaction.referenceNumber = referenceNumber;
    transaction.screenshotPath = file.path;
    transaction.status = 'initiated'; // Keep as initiated until admin confirms
    await txRepo.save(transaction);

    res.json({ 
      success: true, 
      message: 'Payment proof uploaded successfully',
      transaction: {
        id: transaction.id,
        referenceNumber: transaction.referenceNumber,
        status: transaction.status
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function confirmPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { transactionId } = req.params;
    const adminUser = (req as any).user; // From auth middleware

    const txRepo = AppDataSource.getRepository(Transaction);
    const transaction = await txRepo.findOne({ 
      where: { id: transactionId },
      relations: ['booking']
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (!transaction.referenceNumber || !transaction.screenshotPath) {
      return res.status(400).json({ error: 'Payment proof not uploaded yet' });
    }

    // Update transaction as successful
    transaction.status = 'success';
    transaction.paymentDate = new Date();
    transaction.verifiedBy = adminUser.username;
    transaction.verifiedAt = new Date();
    await txRepo.save(transaction);

    // Confirm booking
    const booking = await bookingService.confirmBooking(transaction.booking.id);

    // Send confirmation email
    try {
      await emailService.sendBookingConfirmation(booking, transaction.id);
      
      // Mark email as sent
      booking.emailSent = true;
      await AppDataSource.getRepository('Booking').save(booking);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the confirmation if email fails
    }

    res.json({ 
      success: true, 
      message: 'Payment confirmed and email sent',
      booking 
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const { transactionId } = req.params;

    const txRepo = AppDataSource.getRepository(Transaction);
    const transaction = await txRepo.findOne({ where: { id: transactionId } });

    if (!transaction || !transaction.screenshotPath) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const filePath = transaction.screenshotPath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const fileName = path.basename(filePath);
    res.download(filePath, fileName);
  } catch (err) {
    next(err);
  }
}

export async function deleteReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const { transactionId } = req.params;

    const txRepo = AppDataSource.getRepository(Transaction);
    const transaction = await txRepo.findOne({ where: { id: transactionId } });

    if (!transaction || !transaction.screenshotPath) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const filePath = transaction.screenshotPath;
    
    // Delete file from server
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update transaction
    transaction.screenshotPath = null as any;
    await txRepo.save(transaction);

    res.json({ success: true, message: 'Receipt deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function webhookHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tx = await paymentService.handleGcashWebhook(req.body);
    res.json({ success: true, transaction: tx });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const transaction = await paymentService.getTransactionById(id);
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}