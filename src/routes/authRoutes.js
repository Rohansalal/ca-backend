const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration & Verification
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);

// Login
router.post('/login', authController.login);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
