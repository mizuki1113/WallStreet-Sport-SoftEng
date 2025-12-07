"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiatePayment = initiatePayment;
exports.uploadPaymentProof = uploadPaymentProof;
exports.confirmPayment = confirmPayment;
exports.downloadReceipt = downloadReceipt;
exports.deleteReceipt = deleteReceipt;
exports.webhookHandler = webhookHandler;
exports.getTransactionById = getTransactionById;
const PaymentService_1 = require("../services/PaymentService");
const BookingService_1 = require("../services/BookingService");
const EmailService_1 = require("../services/EmailService");
const ormconfig_1 = require("../ormconfig");
const Transaction_1 = require("../entities/Transaction");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const paymentService = new PaymentService_1.PaymentService();
const bookingService = new BookingService_1.BookingService();
const emailService = new EmailService_1.EmailService();
async function initiatePayment(req, res, next) {
    try {
        const { amount, booking } = req.body;
        if (!amount || !booking) {
            return res
                .status(400)
                .json({ error: 'Amount and booking details required' });
        }
        // Must receive an array of selected time slots
        if (!Array.isArray(booking.timeSlots) || booking.timeSlots.length === 0) {
            return res
                .status(400)
                .json({ error: 'At least one time slot is required' });
        }
        // Let PaymentService handle booking creation + QR-code transaction
        const paymentResult = await paymentService.initiatePayment({
            amount,
            booking: {
                name: booking.name,
                email: booking.email,
                contact: booking.contact,
                date: booking.date,
                timeSlots: booking.timeSlots,
            },
        });
        // paymentResult already contains bookingId, bookingReference, transactionId, etc.
        res.json(paymentResult);
    }
    catch (err) {
        next(err);
    }
}
async function uploadPaymentProof(req, res, next) {
    try {
        const { transactionId, referenceNumber } = req.body;
        const file = req.file;
        if (!transactionId || !referenceNumber || !file) {
            return res.status(400).json({
                error: 'Transaction ID, reference number, and screenshot required',
            });
        }
        const txRepo = ormconfig_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const transaction = await txRepo.findOne({
            where: { id: transactionId },
            relations: ['booking'],
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
                status: transaction.status,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function confirmPayment(req, res, next) {
    try {
        const { transactionId } = req.params;
        const adminUser = req.user; // From auth middleware
        const txRepo = ormconfig_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const transaction = await txRepo.findOne({
            where: { id: transactionId },
            relations: ['booking'],
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        if (!transaction.referenceNumber || !transaction.screenshotPath) {
            return res
                .status(400)
                .json({ error: 'Payment proof not uploaded yet' });
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
            await ormconfig_1.AppDataSource.getRepository('Booking').save(booking);
        }
        catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the confirmation if email fails
        }
        res.json({
            success: true,
            message: 'Payment confirmed and email sent',
            booking,
        });
    }
    catch (err) {
        next(err);
    }
}
async function downloadReceipt(req, res, next) {
    try {
        const { transactionId } = req.params;
        const txRepo = ormconfig_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const transaction = await txRepo.findOne({ where: { id: transactionId } });
        if (!transaction || !transaction.screenshotPath) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        const filePath = transaction.screenshotPath;
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }
        const fileName = path_1.default.basename(filePath);
        res.download(filePath, fileName);
    }
    catch (err) {
        next(err);
    }
}
async function deleteReceipt(req, res, next) {
    try {
        const { transactionId } = req.params;
        const txRepo = ormconfig_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const transaction = await txRepo.findOne({ where: { id: transactionId } });
        if (!transaction || !transaction.screenshotPath) {
            return res.status(404).json({ error: 'Receipt not found' });
        }
        const filePath = transaction.screenshotPath;
        // Delete file from server
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Update transaction
        transaction.screenshotPath = null;
        await txRepo.save(transaction);
        res.json({ success: true, message: 'Receipt deleted successfully' });
    }
    catch (err) {
        next(err);
    }
}
async function webhookHandler(req, res, next) {
    try {
        const tx = await paymentService.handleGcashWebhook(req.body);
        res.json({ success: true, transaction: tx });
    }
    catch (err) {
        next(err);
    }
}
async function getTransactionById(req, res, next) {
    try {
        const { id } = req.params;
        const transaction = await paymentService.getTransactionById(id);
        res.json(transaction);
    }
    catch (err) {
        next(err);
    }
}
