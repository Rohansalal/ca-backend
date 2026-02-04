const { PrismaClient } = require('@prisma/client');

/**
 * Database Configuration Handler
 * Supports multiple database providers:
 * - SQLite (default, file-based)
 * - PostgreSQL (production-ready)
 * - MySQL (alternative)
 * 
 * Switch databases by changing DB_PROVIDER in .env file
 */

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error']
});

// Log which database is being used
console.log(`[Database] Using ${process.env.DB_PROVIDER || 'sqlite'} database`);
console.log(`[Database] URL: ${process.env.DATABASE_URL}`);

// Handle connection events
prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Query] ${e.query}`);
        console.log(`[Duration] ${e.duration}ms`);
    }
});

module.exports = prisma;
