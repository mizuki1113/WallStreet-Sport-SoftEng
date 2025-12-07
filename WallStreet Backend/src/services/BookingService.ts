import { AppDataSource } from '../ormconfig';
import { Booking } from '../entities/Booking';
import { TimeSlot } from '../entities/TimeSlot';

interface CreateBookingDTO {
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
}

export class BookingService {
  private bookingRepo = AppDataSource.getRepository(Booking);
  private timeSlotRepo = AppDataSource.getRepository(TimeSlot);

  private generateBookingReference(): string {
    return `WS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  async getAvailableSlots(date: string) {
    const allSlots = await this.timeSlotRepo.find({ where: { isActive: true } });

    const bookedSlots = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.bookingDate = :date', { date })
      .andWhere('booking.status = :status', { status: 'confirmed' })
      .getMany();

    const bookedTimeSlots = new Set<string>();
    bookedSlots.forEach((b: any) => {
      if (Array.isArray(b.timeSlots)) {
        b.timeSlots.forEach((t: string) => bookedTimeSlots.add(t));
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
  async createBooking(data: CreateBookingDTO) {
    if (!data.timeSlots || !Array.isArray(data.timeSlots) || data.timeSlots.length === 0) {
      throw { status: 400, message: 'Please select at least one time slot' };
    }

    const cleanSlots = data.timeSlots.filter(
      (s): s is CreateBookingDTO['timeSlots'][number] =>
        !!s && typeof s.time === 'string' && s.time.trim().length > 0
    );

    if (cleanSlots.length === 0) {
      throw { status: 400, message: 'Invalid time slots received' };
    }

    const requestedTimes = cleanSlots.map(s => s.time);

    const existingBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.bookingDate = :date', { date: data.date })
      .andWhere('booking.status = :status', { status: 'confirmed' })
      .getMany();

    const alreadyBookedTimes = new Set<string>();
    existingBookings.forEach((b: any) => {
      if (Array.isArray(b.timeSlots)) {
        b.timeSlots.forEach((t: string) => alreadyBookedTimes.add(t));
      }
    });

    const conflicting = requestedTimes.filter(t => alreadyBookedTimes.has(t));
    if (conflicting.length > 0) {
      throw {
        status: 409,
        message: `These time slots are already booked: ${conflicting.join(', ')}`,
      };
    }

    const totalRate = cleanSlots.reduce(
      (sum, s) => sum + Number(s.rate),
      0
    );

    const booking = this.bookingRepo.create({
      bookingReference: this.generateBookingReference(),
      customerName: data.name,
      email: data.email,
      phone: data.contact,
      bookingDate: data.date as any,
      timeSlots: requestedTimes,
      slotDetails: cleanSlots,
      totalRate,
      status: 'pending',
      emailSent: false,
    });

    return await this.bookingRepo.save(booking);
  }

  async confirmBooking(bookingId: string) {
    const booking: any = await this.bookingRepo.findOne({ where: { id: bookingId } });

    if (!booking) {
      throw { status: 404, message: 'Booking not found' };
    }

    const timeSlots: string[] = booking.timeSlots || [];

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      booking.status = 'confirmed';
      return await this.bookingRepo.save(booking);
    }

    const otherBookings: any[] = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.bookingDate = :date', { date: booking.bookingDate })
      .andWhere('b.status = :status', { status: 'confirmed' })
      .andWhere('b.id != :id', { id: bookingId })
      .getMany();

    const bookedTimes = new Set<string>();
    otherBookings.forEach(b => {
      if (Array.isArray(b.timeSlots)) {
        b.timeSlots.forEach((t: string) => bookedTimes.add(t));
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

  async getBookingById(id: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['transactions'],
    });

    if (!booking) {
      throw { status: 404, message: 'Booking not found' };
    }

    return booking;
  }

  async updateBookingStatus(id: string, status: 'confirmed' | 'cancelled') {
    const booking = await this.getBookingById(id);
    booking.status = status;
    return await this.bookingRepo.save(booking);
  }

  async deleteBooking(id: string) {
    const result = await this.bookingRepo.delete(id);
    if (result.affected === 0) {
      throw { status: 404, message: 'Booking not found' };
    }
    return { success: true };
  }

  async getBookingStats() {
    const allBookings: any[] = await this.bookingRepo.find();
    const today = new Date().toISOString().split('T')[0];

    const todayBookings = allBookings.filter(
      b => String(b.bookingDate).split('T')[0] === today
    );
    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');

    const totalRevenue = confirmedBookings.reduce(
      (sum, b) => sum + Number(b.totalRate ?? 0),
      0
    );
    const pendingCount = allBookings.filter(b => b.status === 'pending').length;

    return {
      totalBookings: allBookings.length,
      todayBookings: todayBookings.length,
      totalRevenue,
      pendingBookings: pendingCount,
    };
  }
}
