#!/bin/bash
# VPS Deployment Completion Script
# Run this on the VPS server to complete the deployment

echo "🚀 CA Website Backend - Deployment Completion"
echo "=============================================="
echo ""

# Navigate to backend directory
cd /var/www/ca-website/ca-backend || exit 1

echo "📍 Current directory: $(pwd)"
echo ""

# Check if npm install is still running
if pgrep -f "npm" > /dev/null; then
    echo "⏳ NPM install is still running. Waiting..."
    while pgrep -f "npm" > /dev/null; do
        sleep 5
    done
    echo "✅ NPM install completed"
fi

echo "📦 Verifying node_modules..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Running npm install..."
    npm ci --omit=dev
fi

echo "✅ Dependencies installed"
echo ""

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads/documents
chmod 755 uploads
chown -R ubuntu:ubuntu uploads
echo "✅ Uploads directory created"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Please create .env file with production configuration"
    echo "See .env.production for template"
    exit 1
fi

# Check DATABASE_URL
if ! grep -q "DATABASE_URL" .env; then
    echo "⚠️  DATABASE_URL not found in .env"
    echo "Please add MySQL connection string to .env"
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Run migrations (optional - comment out if database not ready)
echo "🗄️  Running database migrations..."
read -p "Do you want to run migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma migrate deploy
    echo "✅ Migrations completed"
else
    echo "⏭️  Skipping migrations"
fi
echo ""

# Start server with PM2
echo "🚀 Starting server with PM2..."
if pm2 list | grep -q "ca-backend"; then
    echo "Restarting existing PM2 process..."
    pm2 restart ca-backend
else
    echo "Starting new PM2 process..."
    pm2 start src/server.js --name ca-backend -i max
    pm2 save
fi

echo "✅ Server started"
echo ""

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status
echo ""

# Show logs
echo "📋 Recent logs:"
pm2 logs ca-backend --lines 20 --nostream
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
sleep 3
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    curl http://localhost:5000/health
else
    echo "❌ Health check failed"
    echo "Check logs with: pm2 logs ca-backend"
fi
echo ""

# Show uploads directory
echo "📁 Uploads directory:"
ls -lah uploads/
echo ""

echo "🎉 Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Configure Nginx (if not done)"
echo "  2. Setup SSL certificate"
echo "  3. Test from frontend"
echo "  4. Monitor logs: pm2 logs ca-backend"
echo ""
echo "📚 Documentation:"
echo "  - REFACTORED_DEPLOYMENT_GUIDE.md"
echo "  - QUICK_REFERENCE.md"
echo ""
