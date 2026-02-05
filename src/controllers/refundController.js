const prisma = require('../config/db');
const Razorpay = require('razorpay');
const logger = require('../utils/logger');

// Initialize Razorpay (same as payment controller)
const hasValidKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

const razorpay = hasValidKeys
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    })
    : null;

/**
 * Create a refund (Admin only)
 */
exports.createRefund = async (req, res) => {
    try {
        const { paymentId, amount, reason, refundType = 'FULL' } = req.body;
        const adminId = req.user.userId;

        // Validation
        if (!paymentId) {
            return res.status(400).json({ error: 'Payment ID is required' });
        }

        if (!reason) {
            return res.status(400).json({ error: 'Refund reason is required' });
        }

        // Get payment details
        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(paymentId) },
            include: {
                userService: {
                    include: {
                        user: { select: { name: true, email: true } }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status !== 'SUCCESS') {
            return res.status(400).json({ error: 'Only successful payments can be refunded' });
        }

        if (!payment.transactionId) {
            return res.status(400).json({ error: 'Payment has no transaction ID' });
        }

        // Calculate refund amount
        const refundAmount = amount || payment.amount;
        const refundAmountPaise = Math.round(parseFloat(refundAmount) * 100);

        if (refundAmountPaise > parseFloat(payment.amount) * 100) {
            return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
        }

        let razorpayRefund = null;
        let transactionId = null;

        // Process refund through Razorpay
        if (razorpay) {
            try {
                razorpayRefund = await razorpay.payments.refund(payment.transactionId, {
                    amount: refundAmountPaise,
                    notes: {
                        reason,
                        admin_id: adminId,
                        refund_type: refundType
                    }
                });
                transactionId = razorpayRefund.id;
                logger.info(`[Refund] Razorpay refund created: ${transactionId}`);
            } catch (razorpayError) {
                logger.error('[Refund] Razorpay error', razorpayError);
                return res.status(500).json({
                    error: 'Failed to process refund with payment gateway',
                    details: razorpayError.message
                });
            }
        } else {
            // Mock mode for development
            transactionId = `refund_mock_${Date.now()}`;
            logger.warn('[Refund] MOCK MODE - No actual refund processed');
        }

        // Create refund record in database
        const refund = await prisma.refund.create({
            data: {
                paymentId: payment.id,
                amount: refundAmount,
                currency: payment.currency,
                reason,
                refundType,
                status: razorpay ? 'PROCESSING' : 'COMPLETED', // Mock refunds are instant
                transactionId,
                processedBy: adminId,
                notes: `Processed by admin ID ${adminId}`,
                metadata: razorpayRefund ? JSON.stringify(razorpayRefund) : null
            }
        });

        // Update payment status
        const isFullRefund = parseFloat(refundAmount) >= parseFloat(payment.amount);
        const newPaymentStatus = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: newPaymentStatus,
                notes: `Refund ${refund.id} - ${reason}`,
                updatedAt: new Date()
            }
        });

        // If full refund, cancel the service
        if (isFullRefund) {
            await prisma.userService.update({
                where: { id: payment.userServiceId },
                data: {
                    status: 'CANCELLED',
                    updatedAt: new Date()
                }
            });
            logger.info(`[Refund] Service ${payment.userServiceId} cancelled due to full refund`);
        }

        logger.info(`[Refund] Created refund ${refund.id} for payment ${payment.id}`);

        res.json({
            success: true,
            refund: {
                ...refund,
                payment: {
                    id: payment.id,
                    orderId: payment.orderId,
                    amount: payment.amount
                },
                user: payment.userService.user
            },
            message: `Refund of ₹${refundAmount} processed successfully`
        });

    } catch (error) {
        logger.error('[Refund] Creation error', error);
        res.status(500).json({
            error: 'Failed to process refund',
            details: error.message
        });
    }
};

/**
 * Get all refunds (Admin only - with pagination and filters)
 */
exports.getAllRefunds = async (req, res) => {
    try {
        const {
            status,
            refundType,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const where = {};
        if (status) where.status = status;
        if (refundType) where.refundType = refundType;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [refunds, total] = await Promise.all([
            prisma.refund.findMany({
                where,
                include: {
                    payment: {
                        include: {
                            userService: {
                                include: {
                                    user: {
                                        select: { id: true, name: true, email: true }
                                    },
                                    servicePlan: {
                                        include: {
                                            service: {
                                                select: { id: true, name: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: parseInt(limit)
            }),
            prisma.refund.count({ where })
        ]);

        logger.info(`[Refund] Retrieved ${refunds.length} refunds`);

        res.json({
            refunds,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        logger.error('[Refund] Get all error', error);
        res.status(500).json({ error: 'Failed to fetch refunds' });
    }
};

/**
 * Get refund by ID
 */
exports.getRefundById = async (req, res) => {
    try {
        const { id } = req.params;

        const refund = await prisma.refund.findUnique({
            where: { id: parseInt(id) },
            include: {
                payment: {
                    include: {
                        userService: {
                            include: {
                                user: true,
                                servicePlan: {
                                    include: { service: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!refund) {
            return res.status(404).json({ error: 'Refund not found' });
        }

        res.json(refund);

    } catch (error) {
        logger.error('[Refund] Get by ID error', error);
        res.status(500).json({ error: 'Failed to fetch refund' });
    }
};

/**
 * Get refunds for a specific payment
 */
exports.getRefundsByPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const refunds = await prisma.refund.findMany({
            where: { paymentId: parseInt(paymentId) },
            orderBy: { createdAt: 'desc' }
        });

        const totalRefunded = refunds.reduce((sum, refund) => {
            return sum + parseFloat(refund.amount);
        }, 0);

        res.json({
            refunds,
            summary: {
                totalRefunds: refunds.length,
                totalAmount: totalRefunded
            }
        });

    } catch (error) {
        logger.error('[Refund] Get by payment error', error);
        res.status(500).json({ error: 'Failed to fetch refunds for payment' });
    }
};

/**
 * Update refund status (Admin only - for manual status updates)
 */
exports.updateRefundStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const refund = await prisma.refund.update({
            where: { id: parseInt(id) },
            data: {
                status,
                notes: notes || refund.notes,
                updatedAt: new Date()
            }
        });

        logger.info(`[Refund] Updated refund ${id} status to ${status}`);
        res.json({ success: true, refund });

    } catch (error) {
        logger.error('[Refund] Update status error', error);
        res.status(500).json({ error: 'Failed to update refund status' });
    }
};
