const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const webhookController = require('../controllers/webhookController');
const refundController = require('../controllers/refundController');
const { verifyToken } = require('../middleware/authMiddleware');
const { adminAuth } = require('../middleware/adminMiddleware');
const { checkIdempotency } = require('../middleware/idempotencyMiddleware');

// Payment operations (require idempotency)
router.post('/create-order', verifyToken, checkIdempotency({ required: true }), paymentController.createOrder);
router.post('/verify', verifyToken, checkIdempotency({ required: true }), paymentController.verifyPayment);

// Razorpay webhook (NO auth - Razorpay calls this)
// Note: Body should be raw JSON for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), webhookController.razorpayWebhook);

// Refund operations (Admin only)
router.post('/refunds', adminAuth, refundController.createRefund);
router.get('/refunds', adminAuth, refundController.getAllRefunds);
router.get('/refunds/:id', adminAuth, refundController.getRefundById);
router.get('/refunds/payment/:paymentId', adminAuth, refundController.getRefundsByPayment);
router.patch('/refunds/:id/status', adminAuth, refundController.updateRefundStatus);

module.exports = router;
