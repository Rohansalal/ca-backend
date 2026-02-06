# 🚀 Complete VPS Deployment Guide - Start to Finish

**CA Website Backend - Production Deployment**  
**VPS**: ec2-3-6-39-164.ap-south-1.compute.amazonaws.com

---

## 📋 Prerequisites

- VPS/EC2 instance running Ubuntu
- SSH access with key file
- Domain name (optional, for SSL)

---

## PART 1: Initial VPS Setup

### Step 1: Connect to VPS

```bash
ssh -i "C:\Users\Rohan Salal\Downloads\ca-website-ec2-key.pem" ubuntu@ec2-3-6-39-164.ap-south-1.compute.amazonaws.com
```

### Step 2: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 3: Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 4: Install MySQL

```bash
# Install MySQL Server
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation
# Answer prompts:
# - Set root password: YES (choose a strong password)
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql
sudo systemctl status mysql
```

### Step 5: Create Database and User

```bash
# Login to MySQL as root
sudo mysql -u root -p

# Run these SQL commands:
CREATE DATABASE ca_website_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ca_app_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON ca_website_prod.* TO 'ca_app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test the connection
mysql -u ca_app_user -p ca_website_prod
# Enter password, then type: SHOW TABLES; and EXIT;
```

### Step 6: Install PM2

```bash
sudo npm install -g pm2
pm2 --version
```

### Step 7: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## PART 2: Deploy Backend Code

### Step 1: Create Application Directory

```bash
sudo mkdir -p /var/www/ca-website
sudo chown -R ubuntu:ubuntu /var/www/ca-website
cd /var/www/ca-website
```

### Step 2: Clone Repository

```bash
git clone https://github.com/Rohansalal/ca-backend.git ca-backend
cd ca-backend
```

### Step 3: Install Dependencies

```bash
npm ci --omit=dev
```

### Step 4: Create Environment File

```bash
nano .env
```

Paste this configuration (update YOUR_* values):

```env
# Node Environment
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database - MySQL
DATABASE_URL="mysql://ca_app_user:YourStrongPassword123!@localhost:3306/ca_website_prod"

# JWT Secrets (generate with: node scripts/generate-jwt-secrets.js)
JWT_SECRET=your_128_character_secret_here_change_this_in_production
ADMIN_JWT_SECRET=different_128_character_secret_here_change_this_too
JWT_EXPIRES_IN=7d
ADMIN_JWT_EXPIRES_IN=24h

# Razorpay (use test keys or leave commented for now)
# RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
# RAZORPAY_KEY_SECRET=YOUR_SECRET
# RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# CORS & Frontend
CORS_ORIGIN=http://localhost:5173,https://your-amplify-url.com
FRONTEND_URL=https://your-amplify-url.com

# File Uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.pdf,.jpg,.jpeg,.png,.doc,.docx

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_NAME=Admin
ADMIN_SECRET_KEY=admin-secret-production

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Application
APP_NAME=Precision Associates
APP_URL=https://yourdomain.com
APP_ENV=production
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 5: Generate JWT Secrets (Optional)

```bash
node scripts/generate-jwt-secrets.js
# Copy the output and update .env file
```

### Step 6: Setup Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

### Step 7: Create Uploads Directory

```bash
mkdir -p uploads/documents
chmod 755 uploads
```

### Step 8: Start Application with PM2

```bash
# Start in cluster mode
pm2 start src/server.js --name ca-backend -i max

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs ca-backend --lines 50
```

### Step 9: Test Application

```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected output:
# {"status":"Server is running","timestamp":"..."}
```

---

## PART 3: Configure Nginx

### Step 1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ca-backend
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name ec2-3-6-39-164.ap-south-1.compute.amazonaws.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # File upload size
    client_max_body_size 10M;

    # Proxy to Node.js
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
    }

    # Static files
    location /uploads/ {
        alias /var/www/ca-website/ca-backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 2: Enable Site

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable our site
sudo ln -s /etc/nginx/sites-available/ca-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 3: Test External Access

```bash
# From your local machine:
curl http://ec2-3-6-39-164.ap-south-1.compute.amazonaws.com/health
```

---

## PART 4: SSL Certificate (Optional - If You Have Domain)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts and select redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## PART 5: Verification & Testing

### Check All Services

```bash
# Node.js
node --version

# MySQL
sudo systemctl status mysql

# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# Application logs
pm2 logs ca-backend --lines 50

# Disk space
df -h

# Uploads directory
ls -la /var/www/ca-website/ca-backend/uploads/
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Services endpoint
curl http://localhost:5000/api/services

# External access
curl http://ec2-3-6-39-164.ap-south-1.compute.amazonaws.com/health
```

---

## PART 6: Maintenance Commands

### View Logs

```bash
# Application logs
pm2 logs ca-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Restart Services

```bash
# Restart application
pm2 restart ca-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql
```

### Update Code

```bash
cd /var/www/ca-website/ca-backend

# Backup current version
tar -czf ../backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz .

# Pull latest code
git pull origin main

# Install dependencies
npm ci --omit=dev

# Regenerate Prisma
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Restart application
pm2 restart ca-backend
```

### Database Backup

```bash
# Manual backup
mysqldump -u ca_app_user -p ca_website_prod > backup.sql

# Restore from backup
mysql -u ca_app_user -p ca_website_prod < backup.sql
```

---

## 🎉 Deployment Complete!

Your backend is now running at:
- **Health**: http://ec2-3-6-39-164.ap-south-1.compute.amazonaws.com/health
- **API**: http://ec2-3-6-39-164.ap-south-1.compute.amazonaws.com/api/

### Next Steps:

1. Update frontend environment variables with backend URL
2. Test all API endpoints from frontend
3. Setup automated backups
4. Configure monitoring
5. Setup SSL if you have a domain

---

## 🚨 Troubleshooting

### Application won't start
```bash
pm2 logs ca-backend
# Check for errors in logs
```

### Database connection error
```bash
# Test MySQL connection
mysql -u ca_app_user -p ca_website_prod

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Nginx errors
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### Port already in use
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill the process if needed
sudo kill -9 <PID>
```

---

**Deployment Guide Complete!** 🎊
