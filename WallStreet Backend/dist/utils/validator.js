"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingSchema = exports.adminLoginSchema = void 0;
const zod_1 = require("zod");
// ✅ Admin login validation
exports.adminLoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "Username must be at least 3 characters"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
// ✅ Booking validation
exports.bookingSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Customer name required"),
    email: zod_1.z.string().email("Invalid email format"),
    slotId: zod_1.z.number(),
    date: zod_1.z.string(), // or z.date() depending on your frontend
    paymentMethod: zod_1.z.enum(["gcash"]),
    notes: zod_1.z.string().optional(),
});
