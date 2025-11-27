"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const booking_routes_1 = __importDefault(require("./booking.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const receipt_routes_1 = __importDefault(require("./receipt.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/bookings', booking_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/receipts', receipt_routes_1.default);
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
