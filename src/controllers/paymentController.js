const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/db');
const logger = require('../utils/logger');

// Initialize Razorpay only if keys are present
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    })
    : null;

exports.createOrder = async (req, res) => {
    try {
        const { userServiceId } = req.body;
        const userId = req.user.userId;

        console.log(`[Payment] Create Order Init: User ${userId}, Service ${userServiceId}`);

        // 1. Validation: Check Environment Variables
        if (!razorpay) {
            logger.error('[Payment] Razorpay Keys Missing from Environment Variables');
            // If in production, this is a CRITICAL error.
            if (process.env.NODE_ENV === 'production') {
                return res.status(500).json({ error: 'Payment gateway configuration error. Please contact support.' });
            }
            // In Dev, we might allow a mock, but let's be explicit
            console.warn("WARNING: Running in MOCK PAYMENT mode due to missing keys.");
        }

        const userService = await prisma.userService.findUnique({
            where: { id: parseInt(userServiceId) },
            include: { service: true }
        });

        if (!userService) return res.status(404).json({ error: 'Service order not found' });
        if (userService.userId !== userId) return res.status(403).json({ error: 'Unauthorized' });

        // 2. Amount Calculation
        const rawPrice = userService.service.price;
        const priceString = rawPrice && typeof rawPrice === 'object' ? rawPrice.toString() : rawPrice;
        const amount = Math.round(parseFloat(priceString) * 100); // INR in paise

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid service price' });
        }

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `order_rcptid_${userServiceId}`
        };

        let order;

        // 3. Create Order (Real vs Mock)
        if (razorpay) {
            order = await razorpay.orders.create(options);
            logger.info(`[Payment] Razorpay Order Created: ${order.id}`);
        } else {
            // MOCK MODE (Dev Only)
            order = {
                id: `order_mock_${Date.now()}`,
                amount: options.amount,
                currency: 'INR',
                status: 'created',
                notes: { is_mock: true }
            };
            logger.info(`[Payment] Mock Order Created: ${order.id}`);
        }

        // 4. Save to DB
        await prisma.payment.create({
            data: {
                userServiceId: userService.id,
                amount: userService.service.price,
                orderId: order.id,
                status: 'CREATED'
            }
        });

        res.json(order);

    } catch (error) {
        logger.error('[Payment] Create Order Failed', error);
        console.error(error);
        res.status(500).json({ error: 'Payment initiation failed: ' + error.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userServiceId } = req.body;

        logger.info(`[Payment] Verify Request: Order ${razorpay_order_id}, Payment ${razorpay_payment_id}`);

        let isValid = false;

        // 1. Verify Signature
        if (razorpay_order_id.startsWith('order_mock_')) {
            // Mock Validation (Dev Only)
            if (process.env.NODE_ENV === 'production') {
                logger.warn('[Payment] Blocked attempt to verify mock order in production');
                return res.status(400).json({ error: 'Invalid payment environment' });
            }
            isValid = true;
            logger.info('[Payment] Mock Payment Auto-Verified');
        } else {
            // Real Validation
            if (!process.env.RAZORPAY_KEY_SECRET) {
                logger.error('[Payment] Cannot verify: Missing RAZORPAY_KEY_SECRET');
                return res.status(500).json({ error: 'Configuration Error' });
            }

            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const generated_signature = hmac.digest('hex');

            if (generated_signature === razorpay_signature) {
                isValid = true;
            } else {
                logger.warn(`[Payment] Signature Mismatch: Expected ${generated_signature}, got ${razorpay_signature}`);
            }
        }

        if (isValid) {
            await prisma.$transaction([
                prisma.payment.updateMany({
                    where: { orderId: razorpay_order_id },
                    data: {
                        status: 'SUCCESS',
                        transactionId: razorpay_payment_id
                    }
                }),
                prisma.userService.update({
                    where: { id: parseInt(userServiceId) },
                    data: { status: 'ACTIVE' }
                })
            ]);
            logger.info(`[Payment] Verified Successfully: Service ${userServiceId} Activated`);
            res.json({ status: 'success', message: 'Payment verified, Service Activated.' });
        } else {
            res.status(400).json({ error: 'Payment verification failed' });
        }
    } catch (error) {
        logger.error('[Payment] Verification Error', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
