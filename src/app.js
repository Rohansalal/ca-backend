const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');

// Routes (will be created shortly)
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const consultationRoutes = require('./routes/consultationRoutes');

const app = express();

// ✅ Middleware Configuration
// CORS - Allow frontend to communicate with backend
app.use(cors({
    origin: [
        'http://localhost:5173', // Vite default port
        'http://localhost:3000', // Alternative frontend port
        'http://localhost:4173', // Vite preview port
        process.env.CORS_ORIGIN || 'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security Headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Custom Request Logger
app.use(requestLogger);

// Rate Limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/consultations', consultationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    logger.info('Health check', {});
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Logs viewing endpoint (development only)
app.get('/api/logs/:type', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Access denied' });
    }
    const { type } = req.params;
    const lines = req.query.lines || 50;
    const logContent = logger.readRecentLogs(type, parseInt(lines));
    res.type('text/plain').send(logContent);
});

// Error Handling
app.use((err, req, res, next) => {
    logger.error('Unhandled error', err, {
        method: req.method,
        path: req.path,
        ipAddress: req.ip
    });
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

module.exports = app;

