#!/bin/bash
# Quick setup script for local development with MySQL

echo "🚀 CA Website Backend - Local Setup"
echo "===================================="
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20.x"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js: $NODE_VERSION"
echo ""

# Check MySQL
echo "📦 Checking MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL not found. Installing MySQL..."
    echo "Please install MySQL manually or use Docker:"
    echo "  Docker: docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 -d mysql:8"
    exit 1
fi
echo "✅ MySQL installed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/documents
chmod 755 uploads
echo "✅ Uploads directory created"
echo ""

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "📝 Creating .env from template..."
    
    cat > .env << 'EOF'
# Development Environment
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# MySQL Database (Local)
DATABASE_URL="mysql://root:password@localhost:3306/ca_website_dev"

# JWT Secrets (Development only - change for production!)
JWT_SECRET="dev_secret_60fe4c0fadd4ca6895ed72fcbf03eb35dbd675255b12ba85b934036c770af310"
ADMIN_JWT_SECRET="dev_admin_secret_different_from_user_jwt"
JWT_EXPIRES_IN=7d
ADMIN_JWT_EXPIRES_IN=7d

# CORS (Local Frontend)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173

# File Uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.pdf,.jpg,.jpeg,.png,.doc,.docx

# Email (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Admin
ADMIN_EMAIL=admin@localhost
ADMIN_NAME=Admin
ADMIN_SECRET_KEY=dev-admin-secret

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Application
APP_NAME=Precision Associates
APP_URL=http://localhost:5173
APP_ENV=development
EOF
    
    echo "✅ .env file created"
    echo "⚠️  Please update DATABASE_URL with your MySQL credentials"
    echo ""
fi

# Setup MySQL database
echo "🗄️  Setting up MySQL database..."
echo "Please enter your MySQL root password:"
read -s MYSQL_PASSWORD

mysql -u root -p$MYSQL_PASSWORD << 'EOSQL'
CREATE DATABASE IF NOT EXISTS ca_website_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ca_dev_user'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON ca_website_dev.* TO 'ca_dev_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database created successfully!' AS Status;
EOSQL

if [ $? -eq 0 ]; then
    echo "✅ Database setup complete"
    echo ""
    echo "📝 Update your .env file:"
    echo "   DATABASE_URL=\"mysql://ca_dev_user:dev_password@localhost:3306/ca_website_dev\""
    echo ""
else
    echo "⚠️  Database setup failed. Please create manually."
    echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate dev --name init
echo "✅ Migrations complete"
echo ""

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Update .env with your MySQL credentials"
echo "   2. Run: npm run dev"
echo "   3. Test: curl http://localhost:5000/health"
echo ""
echo "📚 Documentation:"
echo "   - REFACTORED_DEPLOYMENT_GUIDE.md (Production)"
echo "   - REFACTORING_SUMMARY.md (Changes)"
echo ""
