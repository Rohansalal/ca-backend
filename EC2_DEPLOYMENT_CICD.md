# 🚀 COMPLETE AWS EC2 DEPLOYMENT + CI/CD GUIDE

**Project**: CA Website Backend  
**Infrastructure**: AWS EC2 + MySQL VPS + GitHub Actions CI/CD  
**Auto-Deploy**: Push to main branch = Auto deployment  

---

## 📋 TABLE OF CONTENTS

1. [EC2 Instance Creation](#part-1-ec2-instance-creation)
2. [Server Setup & Configuration](#part-2-server-setup--configuration)
3. [Environment Variables & JWT Setup](#part-3-environment-variables--jwt-tokens)
4. [GitHub Repository Setup](#part-4-github-repository-setup)
5. [CI/CD Pipeline (GitHub Actions)](#part-5-cicd-pipeline-github-actions)
6. [Deploy & Test](#part-6-deploy--test)

---

## 🖥️ PART 1: EC2 INSTANCE CREATION

### Step 1.1: Launch EC2 Instance

1. **Login to AWS Console**: https://console.aws.amazon.com
2. **Navigate**: EC2 → Instances → Launch Instance
3. **Configure**:

```
Name: ca-website-backend-prod
AMI: Ubuntu Server 22.04 LTS (Free Tier)
Instance Type: t3.small (recommended) or t2.micro (free tier)
```

4. **Key Pair (IMPORTANT)**:
   - Click "Create new key pair"
   - Name: `ca-website-ec2-key`
   - Type: RSA
   - Format: `.pem`
   - **Download and save securely!**

5. **Network Settings**:
   - Create new security group: `ca-backend-sg`
   - Add these rules:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | My IP | SSH access from your IP |
| HTTP | 80 | Anywhere (0.0.0.0/0) | HTTP traffic |
| HTTPS | 443 | Anywhere (0.0.0.0/0) | HTTPS traffic |
| Custom TCP | 5000 | Anywhere (0.0.0.0/0) | Node.js app (temporary) |

6. **Storage**: 
   - 20 GB gp3 SSD

7. **Advanced Details → User Data** (paste this):

```bash
#!/bin/bash
# Update system
apt-get update -y
apt-get upgrade -y

# Install essential tools
apt-get install -y curl wget git build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt-get install -y nginx

# Install MySQL client
apt-get install -y mysql-client

# Create app directory
mkdir -p /var/www/ca-website
chown ubuntu:ubuntu /var/www/ca-website

# Create app user (if needed)
useradd -m -s /bin/bash appuser 2>/dev/null || true
```

8. **Launch Instance**

9. **Note Your Instance Details**:
   - **Public IPv4**: `XX.XX.XX.XX` (save this!)
   - **Instance ID**: `i-xxxxxxxxxxxx`

---

## 🔧 PART 2: SERVER SETUP & CONFIGURATION

### Step 2.1: Connect to EC2

**On Windows (PowerShell)**:

```powershell
# Set correct permissions for key file
icacls "C:\path\to\ca-website-ec2-key.pem" /inheritance:r
icacls "C:\path\to\ca-website-ec2-key.pem" /grant:r "$env:USERNAME`:R"

# Connect to EC2
ssh -i "C:\path\to\ca-website-ec2-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2.2: Verify Installation

```bash
# Check Node.js
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Check PM2
pm2 --version

# Check Nginx
nginx -v
```

### Step 2.3: Setup Application Directory

```bash
# Navigate to app directory
cd /var/www/ca-website

# Create necessary folders
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Set permissions
sudo chown -R ubuntu:ubuntu /var/www/ca-website
chmod 755 /var/www/ca-website
```

### Step 2.4: Configure Nginx

```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create new config
sudo nano /etc/nginx/sites-available/ca-backend
```

**Paste this configuration**:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }

    # Webhook endpoint (no timeout)
    location /api/payments/webhook {
        proxy_pass http://localhost:5000/api/payments/webhook;
        proxy_read_timeout 300s;
    }
}
```

**Save and enable**:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ca-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 2.5: Setup GitHub Access

```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "ec2-deploy-key" -f ~/.ssh/github_deploy_key -N ""

# Display public key
cat ~/.ssh/github_deploy_key.pub
```

**Copy the output** and add it to:
- GitHub → Your Repository → Settings → Deploy Keys → Add Deploy Key
- Title: `EC2 Deployment Key`
- Key: (paste the public key)
- ✅ Allow write access

### Step 2.6: Setup Application User for PM2

```bash
# Configure PM2 for ubuntu user
pm2 startup
# Copy and run the command it outputs (looks like: sudo env PATH=...)

# Save PM2 configuration
pm2 save
```

---

## 🔐 PART 3: ENVIRONMENT VARIABLES & JWT TOKENS

### Step 3.1: Generate JWT Secrets

**On your local machine** (or EC2), run this:

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ADMIN_JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

**Save these outputs!** You'll need them for .env

### Step 3.2: Generate Admin Password Hash

```bash
# On your local machine with Node.js
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourAdminPassword123', 10, (e,h) => console.log(h))"
```

### Step 3.3: Create Production .env File

**On EC2**:

```bash
nano /var/www/ca-website/.env
```

**Paste this complete configuration** (replace `YOUR_*` values):

```env
# ============================================
# PRODUCTION ENVIRONMENT - AWS EC2
# ============================================

# Node Environment
NODE_ENV=production

# Server Configuration
PORT=5000
HOST=0.0.0.0

# ============================================
# DATABASE - MySQL on VPS
# ============================================
# Format: mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="mysql://ca_app_user:YOUR_MYSQL_PASSWORD@YOUR_VPS_IP:3306/ca_website_prod?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10"

# ============================================
# JWT SECRETS (GENERATE NEW ONES!)
# Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# ============================================
JWT_SECRET=PASTE_YOUR_GENERATED_64_CHAR_HEX_HERE
ADMIN_JWT_SECRET=PASTE_YOUR_DIFFERENT_64_CHAR_HEX_HERE

# JWT Expiry
JWT_EXPIRES_IN=7d
ADMIN_JWT_EXPIRES_IN=24h

# ============================================
# RAZORPAY - LIVE CREDENTIALS
# Get from: https://dashboard.razorpay.com/app/keys
# ============================================
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET_KEY_HERE
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET_HERE

# ============================================
# CORS & FRONTEND URL
# ============================================
CORS_ORIGIN=https://main.d1234567890.amplifyapp.com,https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://main.d1234567890.amplifyapp.com

# ============================================
# AWS S3 (Document Storage)
# Get from: AWS IAM User with S3 access
# ============================================
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-south-1
S3_BUCKET_NAME=ca-website-documents-prod

# Upload settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.pdf,.jpg,.jpeg,.png,.doc,.docx

# ============================================
# EMAIL SERVICE (SMTP)
# Gmail App Password: https://myaccount.google.com/apppasswords
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# ============================================
# ADMIN CONFIGURATION
# ============================================
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_NAME=Admin
# Generate with: bcrypt.hash('password', 10)
ADMIN_PASSWORD_HASH=$2b$10$YOUR_HASHED_PASSWORD_HERE

# ============================================
# SECURITY & RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FILE_PATH=/var/www/ca-website/logs

# ============================================
# APPLICATION SETTINGS
# ============================================
APP_NAME=Precision Associates
APP_URL=https://yourdomain.com
```

**Save** (Ctrl+X, Y, Enter)

### Step 3.4: Secure .env File

```bash
# Set strict permissions
chmod 600 /var/www/ca-website/.env

# Verify
ls -la /var/www/ca-website/.env
# Should show: -rw------- (only owner can read/write)
```

---

## 📦 PART 4: GITHUB REPOSITORY SETUP

### Step 4.1: Initialize Git (if not already done)

**On your local machine**:

```bash
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"

# Initialize git (if needed)
git init

# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/ca-website-backend.git
```

### Step 4.2: Create .gitignore

Create/update `.gitignore`:

```bash
# Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.production
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# Database
*.db
*.db-journal
prisma/dev.db

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build outputs
dist/
build/

# Uploads
uploads/
temp/

# Backups
backups/

# PM2
.pm2/
EOF
```

### Step 4.3: Create GitHub Secrets

1. **Go to GitHub**: Your Repository → Settings → Secrets and variables → Actions
2. **Add these secrets** (click "New repository secret" for each):

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `EC2_HOST` | `YOUR_EC2_PUBLIC_IP` | EC2 Console |
| `EC2_USERNAME` | `ubuntu` | Default for Ubuntu AMI |
| `EC2_SSH_KEY` | (Paste entire contents of .pem file) | Your downloaded key file |
| `ENV_FILE` | (Paste entire production .env content) | Your .env from Step 3.3 |

**For EC2_SSH_KEY**: Open your `ca-website-ec2-key.pem` file, copy ALL content including:
```
-----BEGIN RSA PRIVATE KEY-----
...entire key content...
-----END RSA PRIVATE KEY-----
```

---

## 🔄 PART 5: CI/CD PIPELINE (GITHUB ACTIONS)

### Step 5.1: Create GitHub Actions Workflow

Create this directory structure in your backend project:

```bash
mkdir -p .github/workflows
```

### Step 5.2: Create Deployment Workflow File

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch: # Allows manual trigger

jobs:
  deploy:
    name: Deploy Backend to EC2
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies locally (for testing)
        run: |
          npm ci --omit=dev

      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/ec2_key.pem
          chmod 600 ~/.ssh/ec2_key.pem
          ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to EC2
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USERNAME }}
        run: |
          ssh -i ~/.ssh/ec2_key.pem ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
            set -e
            
            echo "🚀 Starting deployment..."
            
            # Navigate to app directory
            cd /var/www/ca-website
            
            # Stop PM2 process (if running)
            pm2 stop ca-backend || true
            
            # Backup current code
            if [ -d "src" ]; then
              echo "📦 Backing up current version..."
              tar -czf backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz src package.json prisma || true
            fi
            
            # Pull latest code
            echo "📥 Pulling latest code..."
            
            # If git repo exists, pull; otherwise clone
            if [ -d ".git" ]; then
              git fetch origin
              git reset --hard origin/main
              git pull origin main
            else
              # First time setup
              git clone https://github.com/YOUR_USERNAME/ca-website-backend.git temp_repo
              mv temp_repo/* .
              mv temp_repo/.* . 2>/dev/null || true
              rm -rf temp_repo
            fi
            
            # Install dependencies
            echo "📦 Installing dependencies..."
            npm ci --omit=dev
            
            # Generate Prisma Client
            echo "🔧 Generating Prisma Client..."
            npx prisma generate
            
            # Run database migrations
            echo "🗄️  Running database migrations..."
            npx prisma migrate deploy
            
            echo "✅ Deployment complete!"
          ENDSSH

      - name: Upload .env file
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USERNAME }}
        run: |
          echo "${{ secrets.ENV_FILE }}" > .env.production
          scp -i ~/.ssh/ec2_key.pem .env.production ${EC2_USER}@${EC2_HOST}:/var/www/ca-website/.env
          rm .env.production

      - name: Restart Application
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USERNAME }}
        run: |
          ssh -i ~/.ssh/ec2_key.pem ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
            cd /var/www/ca-website
            
            # Start/Restart PM2
            if pm2 list | grep -q "ca-backend"; then
              echo "🔄 Restarting application..."
              pm2 restart ca-backend
            else
              echo "🚀 Starting application for first time..."
              pm2 start src/server.js --name ca-backend -i max
              pm2 save
            fi
            
            # Show status
            pm2 status
            
            echo "✅ Application restarted successfully!"
          ENDSSH

      - name: Health Check
        run: |
          sleep 10
          curl -f http://${{ secrets.EC2_HOST }}/health || exit 1
          echo "✅ Health check passed!"

      - name: Cleanup
        run: |
          rm -f ~/.ssh/ec2_key.pem
```

### Step 5.3: Create Manual Rollback Workflow

Create `.github/workflows/rollback.yml`:

```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      backup_timestamp:
        description: 'Backup timestamp (YYYYMMDD-HHMMSS)'
        required: true
        type: string

jobs:
  rollback:
    name: Rollback to Previous Version
    runs-on: ubuntu-latest

    steps:
      - name: Configure SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.EC2_SSH_KEY }}" > ~/.ssh/ec2_key.pem
          chmod 600 ~/.ssh/ec2_key.pem
          ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts

      - name: Rollback Application
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USERNAME }}
          BACKUP_TS: ${{ inputs.backup_timestamp }}
        run: |
          ssh -i ~/.ssh/ec2_key.pem ${EC2_USER}@${EC2_HOST} << ENDSSH
            set -e
            cd /var/www/ca-website
            
            echo "🔄 Rolling back to backup-${BACKUP_TS}..."
            
            # Stop application
            pm2 stop ca-backend
            
            # Restore backup
            if [ -f "backups/backup-${BACKUP_TS}.tar.gz" ]; then
              tar -xzf backups/backup-${BACKUP_TS}.tar.gz
              npm ci --omit=dev
              npx prisma generate
              pm2 restart ca-backend
              echo "✅ Rollback complete!"
            else
              echo "❌ Backup not found!"
              exit 1
            fi
          ENDSSH

      - name: Cleanup
        run: rm -f ~/.ssh/ec2_key.pem
```

### Step 5.4: Commit and Push Workflow Files

```bash
# Add workflow files
git add .github/workflows/deploy.yml
git add .github/workflows/rollback.yml
git add .gitignore

# Commit
git commit -m "Add CI/CD pipeline for auto-deployment"

# Push to GitHub
git push origin main
```

---

## 🎯 PART 6: DEPLOY & TEST

### Step 6.1: Initial Manual Deployment

Since it's the first deployment, let's do it manually first:

**SSH to EC2**:

```bash
ssh -i "path/to/ca-website-ec2-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

**Clone Repository**:

```bash
cd /var/www/ca-website

# Clone your repository
git clone https://github.com/YOUR_USERNAME/ca-website-backend.git .

# Install dependencies
npm ci --omit=dev

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start src/server.js --name ca-backend -i max

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs ca-backend --lines 50
```

### Step 6.2: Test Application

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test from outside
curl http://YOUR_EC2_PUBLIC_IP/health
```

### Step 6.3: Test Auto-Deployment

**On your local machine**:

```bash
# Make a small change
echo "# Updated $(date)" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deployment"
git push origin main
```

**Watch GitHub Actions**:
1. Go to GitHub → Your Repository → Actions
2. You should see "Deploy to EC2" workflow running
3. Watch the progress

**On EC2, watch logs**:

```bash
# Watch PM2 logs during deployment
pm2 logs ca-backend --lines 100
```

### Step 6.4: Verify Deployment

```bash
# Check application is running
pm2 status

# Check latest logs
pm2 logs ca-backend --lines 50

# Test endpoints
curl http://YOUR_EC2_PUBLIC_IP/health
curl http://YOUR_EC2_PUBLIC_IP/api/services
```

---

## 🔧 PART 7: ADDITIONAL SCRIPTS & TOOLS

### Script 1: Local Deployment Test Script

Create `scripts/deploy-test.sh` in your project:

```bash
#!/bin/bash
# Local test before deployment

echo "🧪 Running pre-deployment tests..."

# Install dependencies
npm ci

# Run linting (if configured)
npm run lint || true

# Run tests (if configured)
npm test || true

# Check environment variables
if [ ! -f ".env" ]; then
  echo "❌ .env file not found!"
  exit 1
fi

# Test Prisma schema
npx prisma validate

echo "✅ All checks passed!"
```

### Script 2: Environment Variables Checker

Create `scripts/check-env.sh`:

```bash
#!/bin/bash
# Check if all required environment variables are set

REQUIRED_VARS=(
  "NODE_ENV"
  "PORT"
  "DATABASE_URL"
  "JWT_SECRET"
  "ADMIN_JWT_SECRET"
  "RAZORPAY_KEY_ID"
  "RAZORPAY_KEY_SECRET"
)

echo "🔍 Checking environment variables..."

source .env 2>/dev/null || true

MISSING=0
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Missing: $VAR"
    MISSING=1
  else
    echo "✅ Found: $VAR"
  fi
done

if [ $MISSING -eq 1 ]; then
  echo "❌ Some required variables are missing!"
  exit 1
else
  echo "✅ All required variables are set!"
fi
```

### Script 3: Database Backup Script

Create on EC2: `/usr/local/bin/backup-db.sh`

```bash
#!/bin/bash
BACKUP_DIR="/var/www/ca-website/backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Get DB credentials from .env
source /var/www/ca-website/.env

# Extract from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

gzip $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_FILE.gz"
```

**Make executable and schedule**:

```bash
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab
sudo crontab -e

# Add this line (daily at 2 AM):
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 📊 PART 8: MONITORING & MAINTENANCE

### Setup PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# View monitoring dashboard
pm2 monit

# Setup web monitoring (optional)
pm2 web
```

### Setup Log Rotation

Create `/etc/logrotate.d/ca-backend`:

```bash
sudo nano /etc/logrotate.d/ca-backend
```

```
/var/www/ca-website/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## ✅ DEPLOYMENT CHECKLIST

Before going live, verify:

- [ ] EC2 instance created and accessible
- [ ] Node.js, PM2, Nginx installed
- [ ] MySQL database accessible from EC2
- [ ] .env file created with all variables
- [ ] JWT secrets generated (64 characters each)
- [ ] GitHub repository created
- [ ] GitHub secrets configured (4 secrets)
- [ ] SSH key added to GitHub deploy keys
- [ ] .gitignore configured
- [ ] CI/CD workflow files committed
- [ ] Initial manual deployment successful
- [ ] PM2 running and auto-starting
- [ ] Nginx configured and running
- [ ] Health endpoint accessible
- [ ] Auto-deployment tested (push to main)
- [ ] Database backups scheduled
- [ ] Log rotation configured
- [ ] SSL certificate installed (if using domain)

---

## 🚨 TROUBLESHOOTING

### Deployment Failed

**Check GitHub Actions logs**:
1. GitHub → Repository → Actions
2. Click on failed workflow
3. Check error messages

**Common issues**:

```bash
# SSH connection failed
# Fix: Check EC2_HOST and EC2_SSH_KEY secrets

# Permission denied
# Fix: Check EC2 security group allows SSH (port 22)

# npm install failed
# Fix: Check package.json is valid

# Prisma migration failed
# Fix: Check DATABASE_URL is correct
```

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs ca-backend --lines 100

# Check .env file
cat /var/www/ca-website/.env

# Check Prisma Client
cd /var/www/ca-website
npx prisma generate

# Restart application
pm2 restart ca-backend
```

### Database Connection Failed

```bash
# Test MySQL connection from EC2
mysql -h YOUR_VPS_IP -u ca_app_user -p ca_website_prod

# Check .env DATABASE_URL format
# Should be: mysql://user:pass@host:port/database
```

---

## 🎉 SUCCESS!

Your CI/CD pipeline is now set up!

**What happens now**:
1. You make code changes locally
2. Commit and push to `main` branch
3. GitHub Actions automatically:
   - Checks out code
   - Installs dependencies
   - Deploys to EC2
   - Updates .env
   - Restarts application
   - Runs health check
4. Application is live with new code!

**Deployment Time**: ~2-3 minutes per push

---

## 📚 QUICK REFERENCE

### Essential Commands

```bash
# View application logs
pm2 logs ca-backend

# Restart application
pm2 restart ca-backend

# Check status
pm2 status

# View monitoring
pm2 monit

# Manual deployment
cd /var/www/ca-website && git pull && npm ci && npx prisma generate && pm2 restart ca-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database backup
/usr/local/bin/backup-db.sh

# Check disk space
df -h

# Check memory
free -h
```

### Important Files

| File | Location | Purpose |
|------|----------|---------|
| Application | `/var/www/ca-website` | Main app directory |
| Environment | `/var/www/ca-website/.env` | Production config |
| Logs | `/var/www/ca-website/logs` | Application logs |
| Backups | `/var/www/ca-website/backups` | Code & DB backups |
| Nginx Config | `/etc/nginx/sites-available/ca-backend` | Reverse proxy |
| PM2 Config | `~/.pm2` | Process manager |

---

**Need Help?**

- **GitHub Actions**: Check the Actions tab for deployment logs
- **Application Logs**: `pm2 logs ca-backend`
- **Server Logs**: `sudo journalctl -xe`
- **Database**: Test connection with mysql client
