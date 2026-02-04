/**
 * HTTP Request Logging Middleware
 * Logs all incoming requests and their responses
 */

const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Capture the original send function
    const originalSend = res.send;

    res.send = function (data) {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // Get user info if authenticated
        const userId = req.user?.userId || 'anonymous';

        // Log the request
        logger.access(req.method, req.path, statusCode, duration, {
            userId,
            ipAddress: req.ip || req.connection.remoteAddress,
            contentLength: res.get('content-length') || 0
        });

        // Call the original send function
        res.send = originalSend;
        return res.send(data);
    };

    next();
};

module.exports = requestLogger;
