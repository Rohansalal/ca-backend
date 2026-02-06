# CA Website Backend - Local Setup (Windows)
# PowerShell Script

Write-Host "🚀 CA Website Backend - Local Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 20.x" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check MySQL
Write-Host "📦 Checking MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version
    Write-Host "✅ MySQL installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  MySQL not found." -ForegroundColor Yellow
    Write-Host "Please install MySQL or use Docker:" -ForegroundColor Yellow
    Write-Host "  Download: https://dev.mysql.com/downloads/installer/" -ForegroundColor White
    Write-Host "  Or Docker: docker run --name mysql-dev -e MYSQL_ROOT_PASSWORD=password -p 3306:3306 -d mysql:8" -ForegroundColor White
    
    $continue = Read-Host "Continue without MySQL setup? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Create uploads directory
Write-Host "📁 Creating uploads directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "uploads\documents" | Out-Null
Write-Host "✅ Uploads directory created" -ForegroundColor Green
Write-Host ""

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from template..." -ForegroundColor Yellow
    
    $envContent = @"
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
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "⚠️  Please update DATABASE_URL with your MySQL credentials" -ForegroundColor Yellow
    Write-Host ""
}

# Setup MySQL database
Write-Host "🗄️  MySQL Database Setup" -ForegroundColor Yellow
$setupDb = Read-Host "Do you want to setup MySQL database now? (y/n)"

if ($setupDb -eq 'y') {
    Write-Host "Enter MySQL root password:" -ForegroundColor Yellow
    $mysqlPassword = Read-Host -AsSecureString
    $mysqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
    )
    
    $sqlCommands = @"
CREATE DATABASE IF NOT EXISTS ca_website_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'ca_dev_user'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON ca_website_dev.* TO 'ca_dev_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database created successfully!' AS Status;
"@
    
    $sqlCommands | mysql -u root -p$mysqlPasswordPlain 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup complete" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Update your .env file:" -ForegroundColor Yellow
        Write-Host '   DATABASE_URL="mysql://ca_dev_user:dev_password@localhost:3306/ca_website_dev"' -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "⚠️  Database setup failed. Please create manually." -ForegroundColor Yellow
        Write-Host ""
    }
}

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Prisma generation failed" -ForegroundColor Yellow
}
Write-Host ""

# Run migrations
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
$runMigrations = Read-Host "Run migrations now? (requires MySQL connection) (y/n)"

if ($runMigrations -eq 'y') {
    npx prisma migrate dev --name init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations complete" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Migrations failed. Run manually: npx prisma migrate dev" -ForegroundColor Yellow
    }
}
Write-Host ""

# Create logs directory
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
Write-Host "✅ Logs directory created" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update .env with your MySQL credentials" -ForegroundColor White
Write-Host "   2. Run: npm run dev" -ForegroundColor White
Write-Host "   3. Test: curl http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - REFACTORED_DEPLOYMENT_GUIDE.md (Production)" -ForegroundColor White
Write-Host "   - REFACTORING_SUMMARY.md (Changes)" -ForegroundColor White
Write-Host ""

# Ask to start server
$startServer = Read-Host "Start development server now? (y/n)"
if ($startServer -eq 'y') {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Cyan
    npm run dev
}
