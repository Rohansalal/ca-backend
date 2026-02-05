#!/bin/bash

# =========================================
# SQLite to PostgreSQL Migration Script
# =========================================
# This script migrates data from SQLite development database
# to PostgreSQL production database
# =========================================

set -e  # Exit on error

echo "🚀 Starting database migration from SQLite to PostgreSQL..."
echo "============================================="

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set (PostgreSQL connection string)"
    echo "   Please set: export DATABASE_URL='postgresql://...'"
    exit 1
fi

if [ ! -f "prisma/dev.db" ]; then
    echo "⚠️  WARNING: SQLite database (prisma/dev.db) not found"
    echo "   Skipping data migration, will only create schema"
fi

# Backup SQLite database
echo ""
echo "📦 Step 1: Backing up SQLite database..."
if [ -f "prisma/dev.db" ]; then
    cp prisma/dev.db "prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ SQLite backup created"
else
    echo "⏭️  Skipping backup (no SQLite database found)"
fi

# Update schema to PostgreSQL
echo ""
echo "📝 Step 2: Updating Prisma schema for PostgreSQL..."
# Backup original schema
cp prisma/schema.prisma prisma/schema.prisma.backup

# Update datasource provider
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

echo "✅ Schema updated to PostgreSQL"

# Generate Prisma Client
echo ""
echo "🔧 Step 3: Generating Prisma Client..."
npx prisma generate

# Run migrations on PostgreSQL
echo ""
echo "📊 Step 4: Creating database schema in PostgreSQL..."
npx prisma migrate deploy

echo "✅ PostgreSQL schema created"

# Migrate data (if SQLite database exists)
if [ -f "prisma/dev.db.backup."* ]; then
    echo ""
    echo "📤 Step 5: Migrating data from SQLite to PostgreSQL..."
    node scripts/migrate-data.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Data migration completed successfully"
    else
        echo "❌ Data migration failed"
        exit 1
    fi
else
    echo ""
    echo "⏭️  Step 5: Skipping data migration (no SQLite data found)"
fi

# Verify migration
echo ""
echo "🔍 Step 6: Verifying migration..."
node scripts/verify-migration.js

# Success
echo ""
echo "============================================="
echo "✅ Database migration completed successfully!"
echo "============================================="
echo ""
echo "Next steps:"
echo "1. Test your application with PostgreSQL"
echo "2. Verify all data migrated correctly"
echo "3. Update environment variables in production"
echo "4. Delete SQLite backup if everything works"
echo ""
