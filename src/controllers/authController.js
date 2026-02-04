const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const logger = require('../utils/logger');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('../services/emailService');

// Register user and send OTP
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Check existing user
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email: email }, { phone: phone }] }
        });

        if (existingUser) {
            logger.auth('REGISTER_FAILED', {
                email,
                phone,
                status: 'failed',
                reason: 'Email or Phone already exists',
                ipAddress: req.ip
            });
            return res.status(400).json({ error: 'Email or Phone already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user (Auto-Verified)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                phone,
                password: hashedPassword,
                isEmailVerified: true,
                isPhoneVerified: true,
            }
        });

        // OTP Removed as requested by user
        /* 
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await prisma.oTP.create({
            data: { email, otp, type: 'EMAIL_VERIFICATION', expiresAt }
        });
        await sendOTPEmail(email, otp, 'EMAIL_VERIFICATION', { name });
        */

        // Generate JWT token immediately
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'demo-secret-key',
            { expiresIn: '7d' }
        );

        logger.auth('REGISTER', {
            userId: user.id,
            name,
            email,
            phone,
            status: 'success',
            autoVerified: true,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        logger.error('Registration error', error, {
            email: req.body.email,
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Registration failed' });
    }
};

// Verify email OTP
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find valid OTP
        const otpRecord = await prisma.oTP.findFirst({
            where: {
                email,
                otp,
                type: 'EMAIL_VERIFICATION',
                isUsed: false,
                expiresAt: { gte: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
            logger.auth('VERIFY_FAILED', {
                email,
                status: 'failed',
                reason: 'Invalid or expired OTP',
                ipAddress: req.ip
            });
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Mark OTP as used
        await prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { isUsed: true }
        });

        // Update user verification status
        const user = await prisma.user.update({
            where: { email },
            data: { isEmailVerified: true }
        });

        // Send welcome email
        await sendWelcomeEmail(email, user.name);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'demo-secret-key',
            { expiresIn: '7d' }
        );

        logger.auth('EMAIL_VERIFIED', {
            userId: user.id,
            email,
            status: 'success',
            ipAddress: req.ip
        });

        res.json({
            message: 'Email verified successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        logger.error('Email verification error', error, {
            email: req.body.email,
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Verification failed' });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email, type } = req.body; // type: EMAIL_VERIFICATION or PASSWORD_RESET

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate new OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save OTP
        await prisma.oTP.create({
            data: {
                email,
                otp,
                type: type || 'EMAIL_VERIFICATION',
                expiresAt,
            }
        });

        // Send email
        await sendOTPEmail(email, otp, type || 'EMAIL_VERIFICATION', { name: user.name });

        logger.auth('OTP_RESENT', {
            email,
            type,
            status: 'success',
            ipAddress: req.ip
        });

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        logger.error('Resend OTP error', error, {
            email: req.body.email,
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            logger.auth('LOGIN_FAILED', {
                email,
                status: 'failed',
                reason: 'User not found',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.auth('LOGIN_FAILED', {
                userId: user.id,
                email,
                status: 'failed',
                reason: 'Invalid password',
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            });
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Email verification check DISABLED
        /*
        if (!user.isEmailVerified) {
            logger.auth('LOGIN_FAILED', {
                userId: user.id,
                email,
                status: 'failed',
                reason: 'Email not verified',
                ipAddress: req.ip
            });
            return res.status(403).json({
                error: 'Please verify your email first',
                requiresVerification: true,
                email: user.email
            });
        }
        */

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'demo-secret-key',
            { expiresIn: '7d' }
        );

        logger.auth('LOGIN', {
            userId: user.id,
            email,
            role: user.role,
            status: 'success',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        logger.error('Login error', error, {
            email: req.body.email,
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Login failed' });
    }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if user exists
            return res.json({ message: 'If the email exists, you will receive a reset code' });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Save OTP
        await prisma.oTP.create({
            data: {
                email,
                otp,
                type: 'PASSWORD_RESET',
                expiresAt,
            }
        });

        // Send email
        await sendOTPEmail(email, otp, 'PASSWORD_RESET', { name: user.name });

        logger.auth('PASSWORD_RESET_REQUESTED', {
            userId: user.id,
            email,
            status: 'success',
            ipAddress: req.ip
        });

        res.json({ message: 'If the email exists, you will receive a reset code' });
    } catch (error) {
        logger.error('Forgot password error', error, {
            email: req.body.email,
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Failed to process request' });
    }
};

// Verify Reset OTP
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const otpRecord = await prisma.oTP.findFirst({
            where: {
                email,
                otp,
                type: 'PASSWORD_RESET',
                isUsed: false,
                expiresAt: { gte: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
            logger.auth('RESET_OTP_VERIFY_FAILED', {
                email,
                status: 'failed',
                reason: 'Invalid or expired OTP',
                ipAddress: req.ip
            });
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // Generate temporary token for password reset
        const resetToken = jwt.sign(
            { email, otpId: otpRecord.id },
            process.env.JWT_SECRET || 'demo-secret-key',
            { expiresIn: '15m' }
        );

        logger.auth('RESET_OTP_VERIFIED', {
            email,
            status: 'success',
            ipAddress: req.ip
        });

        res.json({
            message: 'OTP verified',
            resetToken
        });
    } catch (error) {
        logger.error('Verify reset OTP error', error, {
            email: req.body.email,
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Verification failed' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'demo-secret-key');
        } catch (err) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Mark OTP as used
        await prisma.oTP.update({
            where: { id: decoded.otpId },
            data: { isUsed: true }
        });

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        const user = await prisma.user.update({
            where: { email: decoded.email },
            data: { password: hashedPassword }
        });

        logger.auth('PASSWORD_RESET', {
            userId: user.id,
            email: decoded.email,
            status: 'success',
            ipAddress: req.ip
        });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        logger.error('Reset password error', error, {
            ipAddress: req.ip
        });
        res.status(500).json({ error: 'Password reset failed' });
    }
};
