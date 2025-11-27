"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/bookings/slots:
 *   get:
 *     summary: Get available time slots for a date
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of time slots with availability
 */
router.get('/slots', booking_controller_1.getAvailableSlots);
/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking (pending payment)
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               contact:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               timeSlot:
 *                 type: object
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post('/', booking_controller_1.createBooking);
/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 */
router.get('/', auth_1.authMiddleware, auth_1.adminOnly, booking_controller_1.getAllBookings);
/**
 * @swagger
 * /api/bookings/stats:
 *   get:
 *     summary: Get booking statistics (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking statistics
 */
router.get('/stats', auth_1.authMiddleware, auth_1.adminOnly, booking_controller_1.getBookingStats);
/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get single booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get('/:id', booking_controller_1.getBookingById);
/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, cancelled]
 *     responses:
 *       200:
 *         description: Booking status updated
 */
router.patch('/:id/status', auth_1.authMiddleware, auth_1.adminOnly, booking_controller_1.updateBookingStatus);
/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     summary: Delete booking (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted
 */
router.delete('/:id', auth_1.authMiddleware, auth_1.adminOnly, booking_controller_1.deleteBooking);
exports.default = router;
