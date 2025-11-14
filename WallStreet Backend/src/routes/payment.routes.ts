import { Router } from 'express';
import { 
  initiatePayment, 
  uploadPaymentProof,
  confirmPayment,
  downloadReceipt,
  deleteReceipt,
  webhookHandler, 
  getTransactionById 
} from '../controllers/payment.controller';
import { upload } from '../middleware/upload';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate QR Code payment for booking
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               booking:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment initiated, requires proof upload
 */
router.post('/initiate', initiatePayment);

/**
 * @swagger
 * /api/payments/upload-proof:
 *   post:
 *     summary: Upload payment screenshot and reference number
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *               screenshot:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Payment proof uploaded successfully
 */
router.post('/upload-proof', upload.single('screenshot'), uploadPaymentProof);

/**
 * @swagger
 * /api/payments/{transactionId}/confirm:
 *   post:
 *     summary: Admin confirms payment after reviewing proof
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment confirmed and email sent
 */
router.post('/:transactionId/confirm', authMiddleware, adminOnly, confirmPayment);

/**
 * @swagger
 * /api/payments/{transactionId}/download:
 *   get:
 *     summary: Download payment receipt screenshot
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt file download
 */
router.get('/:transactionId/download', authMiddleware, adminOnly, downloadReceipt);

/**
 * @swagger
 * /api/payments/{transactionId}/delete-receipt:
 *   delete:
 *     summary: Delete payment receipt screenshot
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt deleted successfully
 */
router.delete('/:transactionId/delete-receipt', authMiddleware, adminOnly, deleteReceipt);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: GCash webhook for payment status updates
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', webhookHandler);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment/transaction details
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 */
router.get('/:id', getTransactionById);

export default router;