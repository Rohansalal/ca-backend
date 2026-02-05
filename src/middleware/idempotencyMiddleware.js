const logger = require('../utils/logger');

/**
 * Idempotency Middleware
 * Prevents duplicate payment operations
 * CRITICAL for payment endpoints
 */

// In-memory cache (use Redis in production for multi-instance deployments)
const idempotencyCache = new Map();

// Auto-cleanup old entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of idempotencyCache.entries()) {
        if (now - value.timestamp > 24 * 60 * 60 * 1000) {  // 24 hours
            idempotencyCache.delete(key);
        }
    }
}, 60 * 60 * 1000);

exports.checkIdempotency = (options = {}) => {
    const {
        headerName = 'x-idempotency-key',
        required = true,
        ttl = 24 * 60 * 60 * 1000  // 24 hours
    } = options;

    return async (req, res, next) => {
        const key = req.headers[headerName] || req.headers[headerName.toLowerCase()];

        // If idempotency key is required but missing
        if (required && !key) {
            logger.warn('[Idempotency] Missing idempotency key', {
                path: req.path,
                method: req.method,
                ip: req.ip
            });

            return res.status(400).json({
                error: 'Idempotency-Key header required for this operation',
                message: 'Please provide an X-Idempotency-Key header with a unique value (e.g., UUID)'
            });
        }

        // If no key provided but not required, skip
        if (!key) {
            return next();
        }

        // Validate key format (should be UUID or similar)
        if (key.length < 16 || key.length > 128) {
            return res.status(400).json({
                error: 'Invalid idempotency key format',
                message: 'Idempotency key must be between 16 and 128 characters'
            });
        }

        // Check if request already processed
        if (idempotencyCache.has(key)) {
            const cached = idempotencyCache.get(key);
            const age = Date.now() - cached.timestamp;

            logger.info(`[Idempotency] Duplicate request blocked`, {
                key,
                age: `${Math.round(age / 1000)}s`,
                path: req.path
            });

            // Return cached response
            return res.status(cached.statusCode).json(cached.data);
        }

        // Store original res.json for caching
        const originalJson = res.json.bind(res);
        const originalStatus = res.status.bind(res);

        let statusCode = 200;

        // Override res.status to capture status code
        res.status = function (code) {
            statusCode = code;
            return originalStatus(code);
        };

        // Override res.json to cache successful responses
        res.json = function (data) {
            // Only cache successful responses (2xx)
            if (statusCode >= 200 && statusCode < 300) {
                idempotencyCache.set(key, {
                    statusCode,
                    data,
                    timestamp: Date.now()
                });

                logger.info('[Idempotency] Response cached', {
                    key,
                    statusCode,
                    path: req.path
                });

                // Auto-delete after TTL
                setTimeout(() => {
                    if (idempotencyCache.has(key)) {
                        idempotencyCache.delete(key);
                        logger.debug('[Idempotency] Cache entry expired', { key });
                    }
                }, ttl);
            }

            return originalJson(data);
        };

        next();
    };
};

/**
 * Generate idempotency key helper
 * Use this on frontend to generate keys
 */
exports.generateIdempotencyKey = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clear cache (for testing/admin purposes)
 */
exports.clearIdempotencyCache = () => {
    const size = idempotencyCache.size;
    idempotencyCache.clear();
    logger.info('[Idempotency] Cache cleared', { entriesCleared: size });
    return size;
};

/**
 * Get cache stats (for monitoring)
 */
exports.getIdempotencyCacheStats = () => {
    return {
        size: idempotencyCache.size,
        entries: Array.from(idempotencyCache.keys())
    };
};
