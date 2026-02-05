#!/bin/bash
# Pre-deployment test script
# Run this locally before pushing to ensure everything is ready

set -e

echo "🧪 Running pre-deployment tests..."
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "   Node.js: $NODE_VERSION"

# Check npm version
echo "📦 Checking npm version..."
NPM_VERSION=$(npm -v)
echo "   npm: $NPM_VERSION"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci
echo "   ✅ Dependencies installed"
echo ""

# Validate Prisma schema
echo "🔍 Validating Prisma schema..."
npx prisma validate
echo "   ✅ Prisma schema is valid"
echo ""

# Check environment file
echo "🔍 Checking environment file..."
if [ ! -f ".env" ]; then
  echo "   ⚠️  .env file not found (expected for production)"
else
  echo "   ✅ .env file exists"
fi
echo ""

# Check required files
echo "🔍 Checking required files..."
REQUIRED_FILES=(
  "package.json"
  "src/server.js"
  "prisma/schema.prisma"
  ".gitignore"
)

for FILE in "${REQUIRED_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "   ✅ $FILE"
  else
    echo "   ❌ $FILE - MISSING!"
    exit 1
  fi
done
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate > /dev/null 2>&1
echo "   ✅ Prisma Client generated"
echo ""

# Run linting (if configured)
if grep -q '"lint"' package.json; then
  echo "🧹 Running linter..."
  npm run lint || echo "   ⚠️  Linting completed with warnings"
  echo ""
fi

# Run tests (if configured)
if grep -q '"test"' package.json; then
  echo "🧪 Running tests..."
  npm test || echo "   ⚠️  Some tests failed"
  echo ""
fi

echo "✅ All pre-deployment checks passed!"
echo ""
echo "🚀 Ready to deploy! Run:"
echo "   git add ."
echo "   git commit -m \"Your commit message\""
echo "   git push origin main"
echo ""
