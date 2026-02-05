#!/bin/bash
# Environment variables checker
# Verifies all required variables are set

set -e

echo "🔍 Checking environment variables..."
echo ""

# Load .env if exists
if [ -f ".env" ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Required variables
REQUIRED_VARS=(
  "NODE_ENV"
  "PORT"
  "DATABASE_URL"
  "JWT_SECRET"
  "ADMIN_JWT_SECRET"
  "RAZORPAY_KEY_ID"
  "RAZORPAY_KEY_SECRET"
  "CORS_ORIGIN"
  "FRONTEND_URL"
)

MISSING=0

for VAR in "${REQUIRED_VARS[@]}"; do
  VALUE="${!VAR}"
  if [ -z "$VALUE" ]; then
    echo "❌ Missing: $VAR"
    MISSING=1
  else
    # Mask sensitive values
    if [[ "$VAR" == *"SECRET"* ]] || [[ "$VAR" == *"PASSWORD"* ]] || [[ "$VAR" == *"KEY"* ]]; then
      MASKED="${VALUE:0:10}..."
      echo "✅ Found: $VAR = $MASKED"
    else
      echo "✅ Found: $VAR = $VALUE"
    fi
  fi
done

echo ""

if [ $MISSING -eq 1 ]; then
  echo "❌ Some required environment variables are missing!"
  echo ""
  echo "Please ensure all variables are set in your .env file."
  exit 1
else
  echo "✅ All required environment variables are set!"
  
  # Additional checks
  echo ""
  echo "📋 Additional checks:"
  
  # Check JWT secret length
  JWT_LEN=${#JWT_SECRET}
  if [ $JWT_LEN -lt 32 ]; then
    echo "⚠️  JWT_SECRET is too short ($JWT_LEN chars). Recommended: 64+ chars"
  else
    echo "✅ JWT_SECRET length is adequate ($JWT_LEN chars)"
  fi
  
  # Check admin JWT secret length
  ADMIN_JWT_LEN=${#ADMIN_JWT_SECRET}
  if [ $ADMIN_JWT_LEN -lt 32 ]; then
    echo "⚠️  ADMIN_JWT_SECRET is too short ($ADMIN_JWT_LEN chars). Recommended: 64+ chars"
  else
    echo "✅ ADMIN_JWT_SECRET length is adequate ($ADMIN_JWT_LEN chars)"
  fi
  
  # Check if secrets are different
  if [ "$JWT_SECRET" == "$ADMIN_JWT_SECRET" ]; then
    echo "⚠️  JWT_SECRET and ADMIN_JWT_SECRET should be different!"
  else
    echo "✅ JWT secrets are different"
  fi
  
  # Check DATABASE_URL format
  if [[ "$DATABASE_URL" == mysql://* ]]; then
    echo "✅ DATABASE_URL format is correct (MySQL)"
  else
    echo "⚠️  DATABASE_URL should start with 'mysql://'"
  fi
  
  # Check NODE_ENV
  if [ "$NODE_ENV" == "production" ]; then
    echo "✅ NODE_ENV is set to production"
  else
    echo "⚠️  NODE_ENV is not set to production (current: $NODE_ENV)"
  fi
fi

echo ""
