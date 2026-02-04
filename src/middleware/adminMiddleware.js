const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * ==============================================
 * ADMIN MIDDLEWARE - SEPARATE DB
 * ==============================================
 */

/**
 * Admin Authentication Middleware
 * Validates admin JWT token and role
 */
exports.adminAuth = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No authorization token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token with admin secret
        const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

        let decoded;
        try {
            decoded = jwt.verify(token, adminSecret);
        } catch (jwtError) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Validate token type
        if (decoded.tokenType && decoded.tokenType !== 'ADMIN') {
            return res.status(403).json({ error: 'Invalid token type' });
        }

        // Verify Admin in Admin Table
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.userId }, // Token carries userId which is Admin.id
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                password: false // Do not select password
            }
        });

        if (!admin) {
            logger.auth('ADMIN_AUTH_FAILED', {
                userId: decoded.userId,
                reason: 'Admin not found',
                ipAddress: req.ip
            });
            return res.status(401).json({ error: 'Admin not found' });
        }

        // Attach user info to request
        req.user = {
            userId: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            isAdmin: true,
            isSuperAdmin: admin.role === 'SUPER_ADMIN'
        };

        next();
    } catch (error) {
        logger.error('Admin auth middleware error', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

/**
 * Super Admin Only Middleware
 * Restricts access to SUPER_ADMIN role only
 * Must be used after adminAuth middleware
 */
exports.superAdminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({ error: 'Middleware configuration error' });
    }

    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
            error: 'Access denied',
            message: 'Super Admin privileges required'
        });
    }

    next();
};

/**
 * Optional Admin Auth Middleware
 */
exports.optionalAdminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

        const token = authHeader.split(' ')[1];
        if (!token) return next();

        const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, adminSecret);

        if (decoded.tokenType === 'ADMIN') {
            const admin = await prisma.admin.findUnique({
                where: { id: decoded.userId }
            });

            if (admin) {
                req.user = {
                    userId: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                    isAdmin: true
                };
            }
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = exports;
