"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const ormconfig_1 = require("../ormconfig");
const Transaction_1 = require("../entities/Transaction");
const BookingService_1 = require("./BookingService");
class PaymentService {
    constructor() {
        this.txRepo = ormconfig_1.AppDataSource.getRepository(Transaction_1.Transaction);
        this.bookingService = new BookingService_1.BookingService();
    }
    // NEW: QR Code payment flow (no external checkout)
    async initiateQRCodePayment(bookingId, amount) {
        const providerRef = `gcash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Create transaction record
        const tx = this.txRepo.create({
            booking: { id: bookingId },
            providerReference: providerRef,
            status: 'initiated',
            amount,
            paymentMethod: 'gcash'
        });
        await this.txRepo.save(tx);
        return {
            transactionId: tx.id,
            providerReference: providerRef,
            requiresProof: true // Signal frontend to show QR code upload flow
        };
    }
    async handleGcashWebhook(payload) {
        // Process webhook payload
        const providerRef = payload.reference;
        const tx = await this.txRepo.findOne({ where: { providerReference: providerRef }, relations: ['booking'] });
        if (!tx)
            throw { status: 404, message: 'Transaction not found' };
        if (payload.status === 'success' || payload.status === 'COMPLETED') {
            tx.status = 'success';
            await this.txRepo.save(tx);
            // Confirm booking
            if (tx.booking?.id) {
                await this.bookingService.confirmBooking(tx.booking.id);
            }
        }
        else {
            tx.status = 'failed';
            await this.txRepo.save(tx);
        }
        return tx;
    }
    // Get payment/transaction details
    async getTransactionById(id) {
        const tx = await this.txRepo.findOne({
            where: { id },
            relations: ['booking']
        });
        if (!tx) {
            throw { status: 404, message: 'Transaction not found' };
        }
        return tx;
    }
}
exports.PaymentService = PaymentService;
