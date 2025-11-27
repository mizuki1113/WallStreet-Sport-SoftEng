"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const receipt_controller_1 = require("../controllers/receipt.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /api/receipts/{id}:
 *   get:
 *     summary: Generate PDF receipt for booking
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF receipt
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id', receipt_controller_1.generateReceipt);
exports.default = router;
