"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const typeorm_1 = require("typeorm");
const Booking_1 = require("./Booking");
let Transaction = class Transaction {
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Booking_1.Booking, booking => booking.transactions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'booking_id' }),
    __metadata("design:type", Booking_1.Booking)
], Transaction.prototype, "booking", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gcash_transaction_id', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "gcashTransactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, name: 'provider_reference' }),
    __metadata("design:type", String)
], Transaction.prototype, "providerReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'checkout_url', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "checkoutUrl", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Transaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'initiated' }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payment_method', default: 'gcash' }),
    __metadata("design:type", String)
], Transaction.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'payment_date', nullable: true }),
    __metadata("design:type", Date)
], Transaction.prototype, "paymentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_number', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "referenceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'screenshot_path', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "screenshotPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'verified_by', nullable: true }),
    __metadata("design:type", String)
], Transaction.prototype, "verifiedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'verified_at', nullable: true }),
    __metadata("design:type", Date)
], Transaction.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)('transactions')
], Transaction);
