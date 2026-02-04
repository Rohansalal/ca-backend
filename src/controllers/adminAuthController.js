const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * ==============================================
 * ADMIN AUTHENTICATION CONTROLLER - SEPARATE DB
 * ==============================================
 */

// Admin Login (Uses Admin Table)
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find Admin in Admin Table
        const admin = await prisma.admin.findUnique({
            where: { email }
        });

        if (!admin) {
            logger.auth('ADMIN_LOGIN_FAILED', {
                email,
                reason: 'Admin not found',
                ipAddress: req.ip
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            logger.auth('ADMIN_LOGIN_FAILED', {
                adminId: admin.id,
                email,
                reason: 'Invalid password',
                ipAddress: req.ip
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate admin token
        const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
        const token = jwt.sign(
            {
                userId: admin.id, // Using userId key for compatibility with middleware
                role: admin.role,
                email: admin.email,
                tokenType: 'ADMIN'
            },
            adminSecret,
            { expiresIn: '7d' }
        );

        logger.auth('ADMIN_LOGIN_SUCCESS', {
            adminId: admin.id,
            email,
            ipAddress: req.ip
        });

        res.json({
            success: true,
            token,
            user: { // Returning as 'user' for frontend compatibility
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isAdmin: true
            }
        });
    } catch (error) {
        logger.error('Admin login error', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Verify Admin Token
exports.verifyAdminToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ valid: false, error: 'No token' });

        const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, adminSecret);

        if (decoded.tokenType !== 'ADMIN') {
            return res.status(403).json({ valid: false, error: 'Invalid token type' });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: decoded.userId }
        });

        if (!admin) {
            return res.status(401).json({ valid: false, error: 'Admin not found' });
        }

        return res.json({
            valid: true,
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });
    } catch (error) {
        return res.status(401).json({ valid: false, error: 'Invalid token' });
    }
};

// Refresh Admin Token
exports.refreshAdminToken = async (req, res) => {
    // Simplified refresh for now
    res.status(501).json({ error: 'Not implemented' });
};

module.exports = exports;
