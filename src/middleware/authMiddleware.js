const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Try verifying with USER secret first
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { userId, role }
        } catch (err) {
            // If failed, and ADMIN_JWT_SECRET is defined, try verifying with ADMIN secret
            if (process.env.ADMIN_JWT_SECRET) {
                const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
                req.user = decoded;
            } else {
                throw err;
            }
        }

        // Optional: Check if user still exists/is active in DB
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) {
            return res.status(401).json({ error: 'User not found.' });
        }

        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

module.exports = { verifyToken, isAdmin };
