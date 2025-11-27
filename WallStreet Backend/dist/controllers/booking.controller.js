"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = getAvailableSlots;
exports.createBooking = createBooking;
exports.getAllBookings = getAllBookings;
exports.getBookingById = getBookingById;
exports.updateBookingStatus = updateBookingStatus;
exports.deleteBooking = deleteBooking;
exports.getBookingStats = getBookingStats;
const BookingService_1 = require("../services/BookingService");
const bookingService = new BookingService_1.BookingService();
async function getAvailableSlots(req, res, next) {
    try {
        const { date } = req.query;
        if (!date || typeof date !== 'string') {
            return res.status(400).json({ error: 'Date parameter required' });
        }
        const slots = await bookingService.getAvailableSlots(date);
        res.json(slots);
    }
    catch (err) {
        next(err);
    }
}
async function createBooking(req, res, next) {
    try {
        const { name, email, contact, date, timeSlot } = req.body;
        // Validation
        if (!name || !email || !contact || !date || !timeSlot) {
            return res.status(400).json({ error: 'All fields required' });
        }
        const booking = await bookingService.createBooking({
            name,
            email,
            contact,
            date,
            timeSlot
        });
        res.status(201).json(booking);
    }
    catch (err) {
        next(err);
    }
}
async function getAllBookings(req, res, next) {
    try {
        const bookings = await bookingService.getAllBookings();
        // Format for frontend
        const formatted = bookings.map(b => {
            // PostgreSQL date type can return as string or Date
            let dateStr;
            const bookingDate = b.bookingDate;
            if (typeof bookingDate === 'string') {
                dateStr = bookingDate.split('T')[0];
            }
            else if (bookingDate instanceof Date) {
                dateStr = bookingDate.toISOString().split('T')[0];
            }
            else {
                dateStr = String(bookingDate).split('T')[0];
            }
            return {
                id: b.id,
                customerName: b.customerName,
                email: b.email,
                phone: b.phone,
                date: dateStr,
                time: b.displayTime,
                duration: '1 hour',
                paymentMethod: b.transactions?.[0]?.paymentMethod || 'GCash',
                totalAmount: Number(b.rate),
                status: b.status,
                createdAt: b.createdAt instanceof Date
                    ? b.createdAt.toISOString()
                    : String(b.createdAt),
                transactions: b.transactions?.map(t => ({
                    id: t.id,
                    referenceNumber: t.referenceNumber,
                    screenshotPath: t.screenshotPath,
                    status: t.status
                }))
            };
        });
        res.json(formatted);
    }
    catch (err) {
        next(err);
    }
}
async function getBookingById(req, res, next) {
    try {
        const { id } = req.params;
        const booking = await bookingService.getBookingById(id);
        res.json(booking);
    }
    catch (err) {
        next(err);
    }
}
async function updateBookingStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !['confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const booking = await bookingService.updateBookingStatus(id, status);
        res.json(booking);
    }
    catch (err) {
        next(err);
    }
}
async function deleteBooking(req, res, next) {
    try {
        const { id } = req.params;
        const result = await bookingService.deleteBooking(id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
}
async function getBookingStats(req, res, next) {
    try {
        const stats = await bookingService.getBookingStats();
        res.json(stats);
    }
    catch (err) {
        next(err);
    }
}
