/**
 * Logger Utility
 * Handles file-based and console logging for the application
 * Logs are stored in logs/ directory with rotation
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log file paths
const logFiles = {
    combined: path.join(logsDir, 'combined.log'),
    error: path.join(logsDir, 'error.log'),
    auth: path.join(logsDir, 'auth.log'),
    queries: path.join(logsDir, 'queries.log'),
    access: path.join(logsDir, 'access.log'),
};

/**
 * Format timestamp for logs
 */
const getTimestamp = () => {
    const now = new Date();
    return now.toISOString(); // e.g., 2026-01-20T18:16:05.123Z
};

/**
 * Format log message
 */
const formatLog = (level, message, data = {}) => {
    const timestamp = getTimestamp();
    const dataString = Object.keys(data).length > 0 ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataString}\n`;
};

/**
 * Write to file with rotation
 */
const writeToFile = (filePath, message) => {
    try {
        // Check file size and rotate if needed (5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > maxSize) {
                const timestamp = getTimestamp().replace(/[:.]/g, '-');
                const backupPath = filePath.replace(/\.log$/, `.${timestamp}.log`);
                fs.renameSync(filePath, backupPath);
            }
        }
        fs.appendFileSync(filePath, message, 'utf8');
    } catch (err) {
        console.error(`[Logger Error] Failed to write to ${filePath}:`, err.message);
    }
};

/**
 * Main Logger Object
 */
const logger = {
    /**
     * Log general info
     */
    info: (message, data = {}) => {
        const logMessage = formatLog('INFO', message, data);
        console.log(`[INFO] ${message}`, data);
        writeToFile(logFiles.combined, logMessage);
    },

    /**
     * Log errors
     */
    error: (message, error, data = {}) => {
        const errorData = {
            ...data,
            errorMessage: error?.message || error,
            stack: error?.stack || 'No stack trace'
        };
        const logMessage = formatLog('ERROR', message, errorData);
        console.error(`[ERROR] ${message}`, error);
        writeToFile(logFiles.combined, logMessage);
        writeToFile(logFiles.error, logMessage);
    },

    /**
     * Log authentication events (register, login, verify)
     */
    auth: (action, data) => {
        // action: 'REGISTER', 'LOGIN', 'LOGIN_FAILED', 'VERIFY', 'VERIFY_FAILED'
        const authData = {
            action,
            userId: data.userId || 'N/A',
            email: data.email || 'N/A',
            phone: data.phone || 'N/A',
            status: data.status || 'success',
            reason: data.reason || 'N/A',
            ipAddress: data.ipAddress || 'N/A',
            userAgent: data.userAgent || 'N/A',
        };
        const logMessage = formatLog('AUTH', `User ${action}`, authData);
        console.log(`[AUTH] User ${action}:`, authData);
        writeToFile(logFiles.combined, logMessage);
        writeToFile(logFiles.auth, logMessage);
    },

    /**
     * Log HTTP access
     */
    access: (method, path, statusCode, duration, data = {}) => {
        const accessData = {
            method,
            path,
            statusCode,
            duration: `${duration}ms`,
            ...data
        };
        const logMessage = formatLog('ACCESS', `${method} ${path}`, accessData);
        console.log(`[ACCESS] ${method} ${path} - ${statusCode} (${duration}ms)`);
        writeToFile(logFiles.combined, logMessage);
        writeToFile(logFiles.access, logMessage);
    },

    /**
     * Log database queries (for development)
     */
    query: (queryText, duration) => {
        const queryData = {
            query: queryText.substring(0, 100), // First 100 chars
            duration: `${duration}ms`
        };
        const logMessage = formatLog('QUERY', 'Database Query', queryData);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[QUERY] ${duration}ms - ${queryText.substring(0, 50)}...`);
            writeToFile(logFiles.queries, logMessage);
        }
    },

    /**
     * Log warnings
     */
    warn: (message, data = {}) => {
        const logMessage = formatLog('WARN', message, data);
        console.warn(`[WARN] ${message}`, data);
        writeToFile(logFiles.combined, logMessage);
    },

    /**
     * Get log file paths
     */
    getLogPaths: () => logFiles,

    /**
     * Read recent logs
     */
    readRecentLogs: (logType = 'combined', lines = 50) => {
        const filePath = logFiles[logType];
        if (!fs.existsSync(filePath)) {
            return `No logs found for ${logType}`;
        }
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const logLines = content.split('\n').filter(l => l.trim());
            return logLines.slice(-lines).join('\n');
        } catch (err) {
            return `Error reading logs: ${err.message}`;
        }
    }
};

module.exports = logger;
