# 🚀 PRODUCTION DEPLOYMENT GUIDE

**Project**: CA Website - Precision Associates  
**Backend**: Node.js + Express + Prisma  
**Frontend**: React + Vite (AWS Amplify)  
**Database**: MySQL (VPS Server)  
**Backend Host**: AWS EC2  
**Last Updated**: 2026-02-05

---

## 📋 INFRASTRUCTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION SETUP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Frontend   │      │   Backend    │      │  Database │ │
│  │              │      │              │      │           │ │
│  │ AWS Amplify  │─────▶│   AWS EC2    │─────▶│MySQL VPS  │ │
│  │ (React/Vite) │      │ (Node/Express│      │           │ │
│  └──────────────┘      └──────────────┘      └───────────┘ │
│                              │                              │
│                              ▼                              │
│                       ┌──────────────┐                      │
│                       │  Razorpay    │                      │
│                       │  Webhooks    │                      │
│                       └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ PART 1: DATABASE SETUP (MySQL on VPS)

### Step 1.1: Connect to Your VPS

```bash
ssh root@your-vps-ip
# Or use the username provided by your VPS provider
```

### Step 1.2: Install MySQL (if not already installed)

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation
```

**Security Settings**:
- Set root password: **YES** (use a strong password)
- Remove anonymous users: **YES**
- Disallow root login remotely: **NO** (we need remote access)
- Remove test database: **YES**
- Reload privilege tables: **YES**

### Step 1.3: Create Database and User

```bash
# Login to MySQL
sudo mysql -u root -p

# Run these SQL commands:
```

```sql
-- Create database
CREATE DATABASE ca_website_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'ca_app_user'@'%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON ca_website_prod.* TO 'ca_app_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User='ca_app_user';

-- Exit
EXIT;
```

### Step 1.4: Configure MySQL for Remote Access

```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Find this line:
bind-address = 127.0.0.1

# Change to:
bind-address = 0.0.0.0

# Save and exit (Ctrl+X, Y, Enter)

# Restart MySQL
sudo systemctl restart mysql

# Verify MySQL is running
sudo systemctl status mysql
```

### Step 1.5: Configure Firewall

```bash
# Allow MySQL port (3306)
sudo ufw allow 3306/tcp

# Check firewall status
sudo ufw status
```

### Step 1.6: Test Remote Connection

From your local machine:

```bash
mysql -h YOUR_VPS_IP -u ca_app_user -p ca_website_prod
```

If successful, you'll see the MySQL prompt. Type `EXIT;` to close.

**Save These Credentials**:
- **Host**: `YOUR_VPS_IP`
- **Port**: `3306`
- **Database**: `ca_website_prod`
- **Username**: `ca_app_user`
- **Password**: `YOUR_STRONG_PASSWORD_HERE`

---

## 🖥️ PART 2: EC2 SETUP (Backend Deployment)

### Step 2.1: Launch EC2 Instance

1. **Log in to AWS Console**: https://console.aws.amazon.com
2. **Navigate to EC2** → Click "Launch Instance"
3. **Configure Instance**:
   - **Name**: `ca-website-backend-prod`
   - **AMI**: Ubuntu Server 22.04 LTS (Free Tier eligible)
   - **Instance Type**: t2.micro (Free Tier) or t3.small for production
   - **Key Pair**: Create new or use existing (Download the .pem file!)
   - **Security Group**: Create new with these rules:
     - SSH (22) - Your IP only
     - HTTP (80) - Anywhere (0.0.0.0/0)
     - HTTPS (443) - Anywhere (0.0.0.0/0)
     - Custom TCP (5000) - Anywhere (for Node.js - temporary)
   - **Storage**: 20 GB gp3

4. **Launch Instance** and wait for it to start

### Step 2.2: Connect to EC2

```bash
# Set permissions for key file (Windows PowerShell)
icacls "path\to\your-key.pem" /inheritance:r
icacls "path\to\your-key.pem" /grant:r "%USERNAME%:R"

# SSH into EC2 (Replace with your instance IP)
ssh -i "path\to\your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2.3: Install Required Software on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install nginx -y

# Install MySQL client (to test DB connection)
sudo apt install mysql-client -y
```

### Step 2.4: Clone and Setup Backend

```bash
# Create application directory
sudo mkdir -p /var/www/ca-website
sudo chown ubuntu:ubuntu /var/www/ca-website
cd /var/www/ca-website

# Clone your repository (if using Git)
# git clone https://github.com/yourusername/ca-backend.git .

# OR upload via SCP from local machine:
# scp -i "your-key.pem" -r "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend\*" ubuntu@YOUR_EC2_IP:/var/www/ca-website/

# For now, we'll upload manually using SFTP client (FileZilla recommended)
```

**Upload these files from your local backend folder**:
- `package.json`
- `package-lock.json`
- `src/` folder
- `prisma/` folder
- `.env.production` (create this - see below)

### Step 2.5: Create Production Environment File

```bash
# On EC2, create production .env
nano /var/www/ca-website/.env
```

**Add this configuration** (replace with your actual values):

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
DATABASE_URL="mysql://ca_app_user:YOUR_STRONG_PASSWORD_HERE@YOUR_VPS_IP:3306/ca_website_prod?schema=public&connection_limit=10&pool_timeout=20"

# ============================================
# RAZORPAY - LIVE CREDENTIALS
# ============================================
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET_KEY
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# ============================================
# JWT SECRETS - GENERATE STRONG SECRETS
# ============================================
JWT_SECRET=generate_a_very_long_random_string_here_64_chars_minimum
ADMIN_JWT_SECRET=generate_different_strong_secret_for_admin_64_chars

# ============================================
# CORS & FRONTEND URL
# ============================================
CORS_ORIGIN=https://your-amplify-domain.amplifyapp.com,https://yourdomain.com
FRONTEND_URL=https://your-amplify-domain.amplifyapp.com

# ============================================
# AWS S3 (Document Storage)
# ============================================
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=ca-website-documents-prod

# ============================================
# EMAIL SERVICE (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# ============================================
# ADMIN CONFIGURATION
# ============================================
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

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
```

**Save and exit** (Ctrl+X, Y, Enter)

### Step 2.6: Install Dependencies and Setup Database

```bash
cd /var/www/ca-website

# Install Node modules
npm install --production

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (if you have seed script)
# node prisma/seed.js
```

### Step 2.7: Test Database Connection

```bash
# Test MySQL connection from EC2
mysql -h YOUR_VPS_IP -u ca_app_user -p ca_website_prod

# If successful, exit
EXIT;
```

### Step 2.8: Start Application with PM2

```bash
# Start the app
pm2 start src/server.js --name ca-backend

# Configure PM2 to start on system boot
pm2 startup
# Copy and run the command it outputs

# Save PM2 process list
pm2 save

# Check status
pm2 status
pm2 logs ca-backend --lines 50
```

### Step 2.9: Configure Nginx as Reverse Proxy

```bash
# Remove default Nginx config
sudo rm /etc/nginx/sites-enabled/default

# Create new configuration
sudo nano /etc/nginx/sites-available/ca-backend
```

**Add this configuration**:

```nginx
# HTTP Server - Redirects to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com YOUR_EC2_PUBLIC_IP;

    # Redirect all HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # Temporary: Proxy to Node.js (remove after SSL)
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

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

**Save and enable**:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ca-backend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Step 2.10: Test Backend API

```bash
# From EC2
curl http://localhost:5000/health

# From your local machine
curl http://YOUR_EC2_PUBLIC_IP/health
```

You should see: `{"status":"Server is running","timestamp":"..."}`

---

## 🔒 PART 3: SSL CERTIFICATE (HTTPS)

### Step 3.1: Point Domain to EC2

1. **Go to your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Add A Record**:
   - **Type**: A
   - **Name**: `api` (or `@` for root domain)
   - **Value**: `YOUR_EC2_PUBLIC_IP`
   - **TTL**: 3600

3. **Wait for DNS propagation** (5-60 minutes)

4. **Verify DNS**:
```bash
nslookup api.yourdomain.com
```

### Step 3.2: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter your email
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)
```

**Certbot will automatically**:
- Generate SSL certificate
- Update Nginx configuration
- Enable auto-renewal

### Step 3.3: Test HTTPS

```bash
curl https://api.yourdomain.com/health
```

### Step 3.4: Set Up Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Renewal happens automatically via cron
```

---

## 🔗 PART 4: RAZORPAY WEBHOOK SETUP

### Step 4.1: Create Webhook in Razorpay Dashboard

1. **Login**: https://dashboard.razorpay.com
2. **Navigate**: Settings → Webhooks
3. **Click**: "+ Add New Webhook"
4. **Configure**:
   - **Webhook URL**: `https://api.yourdomain.com/api/payments/webhook`
   - **Secret**: Generate strong random string (save it!)
   - **Alert Email**: your-email@domain.com
   - **Active Events**: Select all these:
     - ✅ payment.authorized
     - ✅ payment.captured
     - ✅ payment.failed
     - ✅ refund.created
     - ✅ refund.processed
     - ✅ refund.failed

5. **Save** and copy the webhook secret

### Step 4.2: Update Environment Variables

```bash
# On EC2, edit .env
nano /var/www/ca-website/.env

# Add webhook secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Save and exit
```

### Step 4.3: Restart Application

```bash
pm2 restart ca-backend
pm2 logs ca-backend --lines 50
```

### Step 4.4: Test Webhook

1. **In Razorpay Dashboard** → Webhooks → Your webhook → Test Webhook
2. **Send test**: payment.captured event
3. **Check logs**:
```bash
pm2 logs ca-backend | grep -i webhook
```

---

## 🌐 PART 5: FRONTEND CONFIGURATION (AWS Amplify)

### Step 5.1: Update Frontend Environment Variables

Since your frontend is already on Amplify, update these environment variables:

**In AWS Amplify Console**:
1. Go to your app → App settings → Environment variables
2. **Add/Update**:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
```

3. **Redeploy** your frontend

### Step 5.2: Update CORS in Backend

Your CORS is already configured in `src/config/cors.js`. Just verify it includes your Amplify domain in production `.env`:

```env
CORS_ORIGIN=https://your-app.amplifyapp.com,https://yourdomain.com
```

---

## ✅ PART 6: VERIFICATION CHECKLIST

### Database Connection
```bash
# On EC2
mysql -h YOUR_VPS_IP -u ca_app_user -p ca_website_prod
SHOW TABLES;
EXIT;
```

### Backend Health
```bash
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/api/services
```

### Razorpay Integration
```bash
# Check logs for Razorpay initialization
pm2 logs ca-backend | grep -i razorpay
```

### SSL Certificate
```bash
sudo certbot certificates
```

### PM2 Process
```bash
pm2 status
pm2 monit  # Real-time monitoring
```

### Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

---

## 📊 PART 7: MONITORING & MAINTENANCE

### 7.1: View Logs

```bash
# Application logs
pm2 logs ca-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Application logs (if using file logging)
tail -f /var/www/ca-website/logs/combined.log
```

### 7.2: PM2 Monitoring

```bash
# Live monitoring
pm2 monit

# Process status
pm2 status

# Restart app
pm2 restart ca-backend

# Stop app
pm2 stop ca-backend

# View logs
pm2 logs ca-backend --lines 100
```

### 7.3: Database Backup (Automated)

Create backup script:

```bash
sudo nano /usr/local/bin/backup-database.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ca_website_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

mysqldump -h YOUR_VPS_IP -u ca_app_user -pYOUR_PASSWORD ca_website_prod > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Make executable and schedule**:

```bash
sudo chmod +x /usr/local/bin/backup-database.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/db-backup.log 2>&1
```

### 7.4: System Updates

```bash
# Update system (run monthly)
sudo apt update && sudo apt upgrade -y

# Update Node.js dependencies
cd /var/www/ca-website
npm update

# Regenerate Prisma Client after updates
npx prisma generate

# Restart app
pm2 restart ca-backend
```

---

## 🚨 PART 8: TROUBLESHOOTING

### Issue: 500 Errors on API

**Check**:
```bash
# View logs
pm2 logs ca-backend --lines 100

# Check if Prisma Client is updated
cd /var/www/ca-website
npx prisma generate
pm2 restart ca-backend
```

### Issue: Database Connection Failed

**Check**:
```bash
# Test MySQL connection
mysql -h YOUR_VPS_IP -u ca_app_user -p

# Check .env DATABASE_URL
cat /var/www/ca-website/.env | grep DATABASE_URL

# Check VPS firewall allows EC2 IP
# On VPS: sudo ufw status
```

### Issue: Webhook Not Working

**Check**:
```bash
# Verify webhook secret in .env
cat /var/www/ca-website/.env | grep RAZORPAY_WEBHOOK_SECRET

# Check logs for webhook events
pm2 logs ca-backend | grep -i webhook

# Test endpoint manually
curl -X POST https://api.yourdomain.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'
```

### Issue: SSL Certificate Error

**Fix**:
```bash
# Renew certificate
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: High Memory Usage

**Check**:
```bash
# View resource usage
pm2 monit

# Check system resources
free -h
df -h

# Restart app
pm2 restart ca-backend
```

---

## 🔐 PART 9: SECURITY BEST PRACTICES

### 9.1: Firewall Configuration

```bash
# On EC2 - Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# Block direct access to Node.js port (Nginx proxies it)
sudo ufw deny 5000

# Check status
sudo ufw status numbered
```

### 9.2: SSH Hardening

```bash
# Disable password authentication (key-only)
sudo nano /etc/ssh/sshd_config

# Ensure these settings:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Restart SSH
sudo systemctl restart sshd
```

### 9.3: Regular Security Updates

```bash
# Enable automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📈 PART 10: SCALING & OPTIMIZATION

### 10.1: Enable Gzip Compression in Nginx

```bash
sudo nano /etc/nginx/nginx.conf

# Add in http block:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 10.2: PM2 Cluster Mode (Multi-core)

```bash
# Stop current process
pm2 delete ca-backend

# Start in cluster mode (use all CPU cores)
pm2 start src/server.js -i max --name ca-backend

# Save configuration
pm2 save
```

### 10.3: Database Connection Pooling

Already configured in your `DATABASE_URL`:
```env
DATABASE_URL="mysql://...?connection_limit=10&pool_timeout=20"
```

---

## 📝 QUICK REFERENCE

### Essential Commands

| Task | Command |
|------|---------|
| SSH to EC2 | `ssh -i key.pem ubuntu@YOUR_EC2_IP` |
| View logs | `pm2 logs ca-backend` |
| Restart app | `pm2 restart ca-backend` |
| Check status | `pm2 status` |
| Test DB | `mysql -h VPS_IP -u ca_app_user -p` |
| Nginx reload | `sudo systemctl reload nginx` |
| View Nginx logs | `sudo tail -f /var/log/nginx/error.log` |
| SSL renew | `sudo certbot renew` |

### Important URLs

- **Backend API**: `https://api.yourdomain.com`
- **Health Check**: `https://api.yourdomain.com/health`
- **Razorpay Dashboard**: `https://dashboard.razorpay.com`
- **AWS EC2 Console**: `https://console.aws.amazon.com/ec2`
- **AWS Amplify**: `https://console.aws.amazon.com/amplify`

### Support Contacts

- **Razorpay Support**: support@razorpay.com
- **AWS Support**: https://console.aws.amazon.com/support
- **MySQL VPS**: Your VPS provider's support

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] MySQL database created and accessible from EC2
- [ ] Backend running on EC2 with PM2
- [ ] Nginx configured and running
- [ ] SSL certificate installed and valid
- [ ] Domain pointed to EC2
- [ ] Razorpay webhook configured and tested
- [ ] Frontend deployed on Amplify with correct API URL
- [ ] Environment variables set correctly in both frontend and backend
- [ ] Test user registration and login
- [ ] Test service purchase flow end-to-end
- [ ] Test payment with Razorpay
- [ ] Verify webhook updates payment status
- [ ] Test admin login and functions
- [ ] Database backups scheduled
- [ ] Monitoring set up (PM2 + CloudWatch)
- [ ] Error logging working
- [ ] Security groups configured correctly
- [ ] Firewall rules set properly

---

## 🎉 DEPLOYMENT COMPLETE

Your CA Website is now live in production!

**What's Running**:
- ✅ Frontend: AWS Amplify
- ✅ Backend: AWS EC2 (Node.js + PM2 + Nginx)
- ✅ Database: MySQL on VPS
- ✅ Payments: Razorpay (Live Mode)
- ✅ SSL: Let's Encrypt (Auto-renewing)

**Next Steps**:
1. Monitor application logs regularly
2. Set up alerting for critical errors
3. Perform regular backups
4. Keep dependencies updated
5. Monitor Razorpay dashboard for transactions

---

**Need Help?**  
Check the troubleshooting section or review logs using the commands in the Quick Reference.

**For urgent issues**:
- Check PM2 logs: `pm2 logs ca-backend`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify database connection from EC2
