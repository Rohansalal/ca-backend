const prisma = require('../config/db');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Razorpay Webhook Handler - Production Ready
 * Automatically processes payment events from Razorpay
 */
exports.razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            logger.warn('[Webhook] No webhook secret configured');
            return res.status(500).json({ error: 'Webhook not configured' });
        }

        // Verify webhook signature
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(req.body);

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            logger.warn('[Webhook] Invalid signature received');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        logger.info(`[Webhook] Event received: ${event}`);

        switch (event) {
            case 'payment.captured':
                await handlePaymentCaptured(payload.payment.entity);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload.payment.entity);
                break;

            case 'refund.processed':
                await handleRefundProcessed(payload.refund.entity);
                break;

            case 'refund.failed':
                await handleRefundFailed(payload.refund.entity);
                break;

            default:
                logger.info(`[Webhook] Unhandled event: ${event}`);
        }

        res.json({ status: 'ok' });

    } catch (error) {
        logger.error('[Webhook] Processing error', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(payment) {
    try {
        const { id: transactionId, order_id: orderId, amount, method } = payment;

        logger.info(`[Webhook] Payment captured: ${transactionId}`);

        // Update payment record
        const updatedPayment = await prisma.payment.updateMany({
            where: { orderId },
            data: {
                status: 'SUCCESS',
                transactionId,
                paymentMethod: method,
                metadata: JSON.stringify(payment),
                updatedAt: new Date()
            }
        });

        if (updatedPayment.count === 0) {
            logger.warn(`[Webhook] No payment found for order: ${orderId}`);
            return;
        }

        // Get the payment to find associated service
        const paymentRecord = await prisma.payment.findFirst({
            where: { orderId },
            include: { userService: true }
        });

        if (!paymentRecord) return;

        // Activate the user service
        await prisma.userService.update({
            where: { id: paymentRecord.userServiceId },
            data: {
                status: 'ACTIVE',
                updatedAt: new Date()
            }
        });

        logger.info(`[Webhook] Service activated: ${paymentRecord.userServiceId}`);

        // TODO: Send confirmation email to user

    } catch (error) {
        logger.error('[Webhook] Payment capture handling error', error);
        throw error;
    }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment) {
    try {
        const { order_id: orderId, error_reason } = payment;

        logger.warn(`[Webhook] Payment failed: ${orderId} - ${error_reason}`);

        await prisma.payment.updateMany({
            where: { orderId },
            data: {
                status: 'FAILED',
                notes: error_reason || 'Payment failed',
                metadata: JSON.stringify(payment),
                updatedAt: new Date()
            }
        });

        // TODO: Notify user of failed payment

    } catch (error) {
        logger.error('[Webhook] Payment failed handling error', error);
        throw error;
    }
}

/**
 * Handle successful refund
 */
async function handleRefundProcessed(refund) {
    try {
        const { id: transactionId, amount, payment_id } = refund;

        logger.info(`[Webhook] Refund processed: ${transactionId}`);

        await prisma.refund.updateMany({
            where: { transactionId },
            data: {
                status: 'COMPLETED',
                metadata: JSON.stringify(refund),
                updatedAt: new Date()
            }
        });

        // TODO: Send refund confirmation email

    } catch (error) {
        logger.error('[Webhook] Refund processed handling error', error);
        throw error;
    }
}

/**
 * Handle failed refund
 */
async function handleRefundFailed(refund) {
    try {
        const { id: transactionId } = refund;

        logger.warn(`[Webhook] Refund failed: ${transactionId}`);

        await prisma.refund.updateMany({
            where: { transactionId },
            data: {
                status: 'FAILED',
                metadata: JSON.stringify(refund),
                updatedAt: new Date()
            }
        });

        // TODO: Alert admin team of failed refund

    } catch (error) {
        logger.error('[Webhook] Refund failed handling error', error);
        throw error;
    }
}
