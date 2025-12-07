"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReceipt = generateReceipt;
const pdfkit_1 = __importDefault(require("pdfkit"));
const BookingService_1 = require("../services/BookingService");
const bookingService = new BookingService_1.BookingService();
async function generateReceipt(req, res, next) {
    try {
        const { id } = req.params;
        const booking = await bookingService.getBookingById(id);
        if (booking.status !== 'confirmed') {
            return res
                .status(400)
                .json({ error: 'Cannot generate receipt for unconfirmed booking' });
        }
        const doc = new pdfkit_1.default({ margin: 50 });
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${booking.bookingReference}.pdf`);
        doc.pipe(res);
        // Header
        doc.fontSize(20).text('WallStreet Sport', { align: 'center' });
        doc.fontSize(14).text('Basketball Court Reservation', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text('Official Receipt', { align: 'center' });
        doc.moveDown(2);
        // --- Normalize date safely (string | Date) ---
        const rawDate = booking.bookingDate;
        let bookingDateObj;
        if (rawDate instanceof Date) {
            bookingDateObj = rawDate;
        }
        else if (typeof rawDate === 'string') {
            bookingDateObj = new Date(rawDate.split('T')[0]);
        }
        else {
            bookingDateObj = new Date(String(rawDate));
        }
        const bookingDateFormatted = bookingDateObj.toLocaleDateString('en-US');
        // --- Multi-slot support: time text & periods ---
        const b = booking;
        const hasSlotDetails = Array.isArray(b.slotDetails) && b.slotDetails.length > 0;
        const timeText = hasSlotDetails
            ? b.slotDetails.map((s) => s.displayTime).join(', ')
            : Array.isArray(b.timeSlots)
                ? b.timeSlots.join(', ')
                : b.displayTime ?? 'N/A';
        const periods = hasSlotDetails
            ? Array.from(new Set(b.slotDetails.map((s) => s.period === 'evening' ? 'Evening (Premium)' : 'Morning/Afternoon'))).join(', ')
            : b.period
                ? b.period === 'evening'
                    ? 'Evening (Premium)'
                    : 'Morning/Afternoon'
                : 'N/A';
        // --- Total amount / downpayment / balance ---
        const totalAmountNumber = typeof b.totalRate === 'number' && !Number.isNaN(b.totalRate)
            ? b.totalRate
            : typeof b.rate === 'number'
                ? b.rate
                : 0;
        const totalAmount = Number(totalAmountNumber);
        const downpayment = Math.floor(totalAmount / 2);
        const remaining = totalAmount - downpayment;
        // Receipt Details
        doc.font('Helvetica-Bold').fontSize(12).text(`Receipt #: ${booking.bookingReference}`);
        doc.font('Helvetica');
        doc.moveDown();
        doc.fontSize(10);
        doc.text(`Customer Name: ${booking.customerName}`);
        doc.text(`Email: ${booking.email}`);
        doc.text(`Phone: ${booking.phone}`);
        doc.moveDown();
        doc.text(`Booking Date: ${bookingDateFormatted}`);
        doc.text(`Time Slot(s): ${timeText}`);
        doc.text(`Period(s): ${periods}`);
        doc.moveDown();
        doc.text(`Total Rate: PHP ${totalAmount.toFixed(2)}`);
        doc.text(`Downpayment Paid: PHP ${downpayment.toFixed(2)}`);
        doc.text(`Remaining Balance: PHP ${remaining.toFixed(2)}`);
        doc.moveDown();
        if (booking.transactions?.[0]) {
            const tx = booking.transactions[0];
            const rawPaymentDate = tx.paymentDate;
            let paymentDateStr = 'N/A';
            if (rawPaymentDate instanceof Date) {
                paymentDateStr = rawPaymentDate.toLocaleString();
            }
            else if (typeof rawPaymentDate === 'string') {
                const d = new Date(rawPaymentDate);
                paymentDateStr = d.toLocaleString();
            }
            doc.text(`Payment Method: ${tx.paymentMethod?.toUpperCase() || 'N/A'}`);
            doc.text(`Transaction ID: ${tx.gcashTransactionId || tx.id}`);
            doc.text(`Payment Date: ${paymentDateStr}`);
        }
        doc.moveDown(2);
        // Footer
        doc.fontSize(8).text('Thank you for choosing WallStreet Sport!', {
            align: 'center',
        });
        doc.text('Please show this receipt upon arrival.', { align: 'center' });
        doc.text('First to pay always gets the slot.', { align: 'center' });
        doc.end();
    }
    catch (err) {
        next(err);
    }
}
