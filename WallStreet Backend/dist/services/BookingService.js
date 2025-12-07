"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const ormconfig_1 = require("../ormconfig");
const Booking_1 = require("../entities/Booking");
const TimeSlot_1 = require("../entities/TimeSlot");
class BookingService {
    constructor() {
        this.bookingRepo = ormconfig_1.AppDataSource.getRepository(Booking_1.Booking);
        this.timeSlotRepo = ormconfig_1.AppDataSource.getRepository(TimeSlot_1.TimeSlot);
    }
    generateBookingReference() {
        return `WS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
    async getAvailableSlots(date) {
        const allSlots = await this.timeSlotRepo.find({ where: { isActive: true } });
        const bookedSlots = await this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.bookingDate = :date', { date })
            .andWhere('booking.status = :status', { status: 'confirmed' })
            .getMany();
        const bookedTimeSlots = new Set();
        bookedSlots.forEach((b) => {
            if (Array.isArray(b.timeSlots)) {
                b.timeSlots.forEach((t) => bookedTimeSlots.add(t));
            }
        });
        return allSlots.map(slot => ({
            time: slot.timeRange,
            displayTime: slot.displayTime,
            rate: Number(slot.rate),
            available: !bookedTimeSlots.has(slot.timeRange),
            period: slot.period,
        }));
    }
    // 🔴 MULTI-SLOT booking creation
    async createBooking(data) {
        if (!data.timeSlots || !Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
            throw { status: 400, message: 'Please select at least one time slot' };
        }
        const cleanSlots = data.timeSlots.filter((s) => !!s && typeof s.time === 'string' && s.time.trim().length > 0);
        if (cleanSlots.length === 0) {
            throw { status: 400, message: 'Invalid time slots received' };
        }
        const requestedTimes = cleanSlots.map(s => s.time);
        const existingBookings = await this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.bookingDate = :date', { date: data.date })
            .andWhere('booking.status = :status', { status: 'confirmed' })
            .getMany();
        const alreadyBookedTimes = new Set();
        existingBookings.forEach((b) => {
            if (Array.isArray(b.timeSlots)) {
                b.timeSlots.forEach((t) => alreadyBookedTimes.add(t));
            }
        });
        const conflicting = requestedTimes.filter(t => alreadyBookedTimes.has(t));
        if (conflicting.length > 0) {
            throw {
                status: 409,
                message: `These time slots are already booked: ${conflicting.join(', ')}`,
            };
        }
        const totalRate = cleanSlots.reduce((sum, s) => sum + Number(s.rate), 0);
        const booking = this.bookingRepo.create({
            bookingReference: this.generateBookingReference(),
            customerName: data.name,
            email: data.email,
            phone: data.contact,
            bookingDate: data.date,
            timeSlots: requestedTimes,
            slotDetails: cleanSlots,
            totalRate,
            status: 'pending',
            emailSent: false,
        });
        return await this.bookingRepo.save(booking);
    }
    async confirmBooking(bookingId) {
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
        if (!booking) {
            throw { status: 404, message: 'Booking not found' };
        }
        const timeSlots = booking.timeSlots || [];
        if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
            booking.status = 'confirmed';
            return await this.bookingRepo.save(booking);
        }
        const otherBookings = await this.bookingRepo
            .createQueryBuilder('b')
            .where('b.bookingDate = :date', { date: booking.bookingDate })
            .andWhere('b.status = :status', { status: 'confirmed' })
            .andWhere('b.id != :id', { id: bookingId })
            .getMany();
        const bookedTimes = new Set();
        otherBookings.forEach(b => {
            if (Array.isArray(b.timeSlots)) {
                b.timeSlots.forEach((t) => bookedTimes.add(t));
            }
        });
        const hasConflict = timeSlots.some(t => bookedTimes.has(t));
        if (hasConflict) {
            throw {
                status: 409,
                message: 'One or more selected slots were just booked by someone else',
            };
        }
        booking.status = 'confirmed';
        return await this.bookingRepo.save(booking);
    }
    async getAllBookings() {
        return await this.bookingRepo.find({
            order: { createdAt: 'DESC' },
            relations: ['transactions'],
        });
    }
    async getBookingById(id) {
        const booking = await this.bookingRepo.findOne({
            where: { id },
            relations: ['transactions'],
        });
        if (!booking) {
            throw { status: 404, message: 'Booking not found' };
        }
        return booking;
    }
    async updateBookingStatus(id, status) {
        const booking = await this.getBookingById(id);
        booking.status = status;
        return await this.bookingRepo.save(booking);
    }
    async deleteBooking(id) {
        const result = await this.bookingRepo.delete(id);
        if (result.affected === 0) {
            throw { status: 404, message: 'Booking not found' };
        }
        return { success: true };
    }
    async getBookingStats() {
        const allBookings = await this.bookingRepo.find();
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = allBookings.filter(b => String(b.bookingDate).split('T')[0] === today);
        const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalRate ?? 0), 0);
        const pendingCount = allBookings.filter(b => b.status === 'pending').length;
        return {
            totalBookings: allBookings.length,
            todayBookings: todayBookings.length,
            totalRevenue,
            pendingBookings: pendingCount,
        };
    }
}
exports.BookingService = BookingService;
