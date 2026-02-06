# 🚀 REFACTORED BACKEND - EC2 DEPLOYMENT GUIDE

**Updated**: 2026-02-06  
**Changes**: Removed AWS S3, Using MySQL + Local File Storage  
**Frontend**: AWS Amplify Compatible  

---

## ✅ WHAT CHANGED

### Removed:
- ❌ AWS S3 dependencies (`aws-sdk`)
- ❌ S3 file upload/download logic
- ❌ AWS environment variables (ACCESS_KEY, SECRET_KEY, BUCKET_NAME)
- ❌ SQLite database (development only)

### Added:
- ✅ Local file storage on EC2/VPS (`uploads/` directory)
- ✅ MySQL database support (production-ready)
- ✅ File download endpoints
- ✅ Secure file access with authentication
- ✅ AWS Amplify CORS configuration

---

## 📦 SYSTEM REQUIREMENTS

### EC2 Instance:
- **OS**: Ubuntu 22.04 LTS
- **Instance Type**: t3.small or larger
- **Storage**: 20GB+ (for application + file uploads)
- **RAM**: 2GB minimum

### MySQL Database:
- **Option 1**: MySQL on same EC2 instance (localhost)
- **Option 2**: MySQL on separate VPS server
- **Version**: MySQL 8.0+
- **Storage**: 10GB+ for database

---

## 🔧 PART 1: MYSQL SETUP

### Option A: MySQL on EC2 (Same Server)

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install MySQL
sudo apt install mysql-server -y

# Secure MySQL
sudo mysql_secure_installation
# - Set root password: YES
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES

# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE ca_website_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ca_app_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON ca_website_prod.* TO 'ca_app_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test connection
mysql -u ca_app_user -p ca_website_prod
```

**Your DATABASE_URL**:
```env
DATABASE_URL="mysql://ca_app_user:YOUR_STRONG_PASSWORD@localhost:3306/ca_website_prod"
```

---

### Option B: MySQL on External VPS

```bash
# On your VPS server
sudo apt update && sudo apt install mysql-server -y

# Edit MySQL config for remote access
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Change bind-address
bind-address = 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql

# Create database and user
sudo mysql -u root -p

CREATE DATABASE ca_website_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ca_app_user'@'%' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON ca_website_prod.* TO 'ca_app_user'@'%';
FLUSH PRIVILEGES;
EXIT;

# Configure firewall
sudo ufw allow 3306/tcp
```

**Your DATABASE_URL**:
```env
DATABASE_URL="mysql://ca_app_user:YOUR_STRONG_PASSWORD@YOUR_VPS_IP:3306/ca_website_prod"
```

**Test from EC2**:
```bash
mysql -h YOUR_VPS_IP -u ca_app_user -p ca_website_prod
```

---

## 🖥️ PART 2: EC2 BACKEND SETUP

### Step 1: Install Dependencies

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Verify installations
node --version  # v20.x.x
npm --version   # 10.x.x
pm2 --version
nginx -v
```

### Step 2: Setup Application Directory

```bash
# Create app directory
sudo mkdir -p /var/www/ca-website
sudo chown ubuntu:ubuntu /var/www/ca-website
cd /var/www/ca-website

# Clone your repository
git clone https://github.com/YOUR_USERNAME/ca-backend.git .

# Or upload via SCP
# scp -i key.pem -r ./backend/* ubuntu@EC2_IP:/var/www/ca-website/
```

### Step 3: Configure Environment

```bash
# Create .env file
nano /var/www/ca-website/.env
```

**Paste this configuration** (update YOUR_* values):

```env
# Node Environment
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database - MySQL
DATABASE_URL="mysql://ca_app_user:YOUR_PASSWORD@localhost:3306/ca_website_prod"

# JWT Secrets (generate with: node scripts/generate-jwt-secrets.js)
JWT_SECRET=your_128_character_secret_here
ADMIN_JWT_SECRET=your_different_128_character_secret_here
JWT_EXPIRES_IN=7d
ADMIN_JWT_EXPIRES_IN=24h

# Razorpay Live
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# CORS & Frontend (AWS Amplify)
CORS_ORIGIN=https://main.d1234567890.amplifyapp.com,https://yourdomain.com
FRONTEND_URL=https://main.d1234567890.amplifyapp.com

# File Uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=.pdf,.jpg,.jpeg,.png,.doc,.docx

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

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

**Save** (Ctrl+X, Y, Enter)

### Step 4: Install and Setup

```bash
cd /var/www/ca-website

# Install dependencies (production only)
npm ci --omit=dev

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Create uploads directory
mkdir -p uploads/documents
chmod 755 uploads

# Check everything
ls -la
```

### Step 5: Start with PM2

```bash
# Start application
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

---

## 🌐 PART 3: NGINX CONFIGURATION

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
    server_name YOUR_EC2_IP api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase body size for file uploads
    client_max_body_size 10M;

    # Proxy to Node.js application
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
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static file serving for uploads
    location /uploads/ {
        alias /var/www/ca-website/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

**Enable and restart**:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ca-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 PART 4: SSL CERTIFICATE (HTTPS)

### Prerequisites:
- Domain name pointed to EC2 IP
- DNS propagated (wait 5-60 minutes)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS: YES

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certbot automatically updates Nginx config for HTTPS!**

---

## 🔗 PART 5: FRONTEND INTEGRATION (AWS AMPLIFY)

### Update Frontend Environment Variables

In **AWS Amplify Console**:

1. Go to your app → **App settings** → **Environment variables**
2. Add/Update:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
```

3. **Redeploy** frontend

### Update Backend CORS

Already configured in `.env`:

```env
CORS_ORIGIN=https://main.d1234567890.amplifyapp.com,https://yourdomain.com
```

---

## ✅ PART 6: VERIFICATION

### Test Backend

```bash
# Health check
curl http://YOUR_EC2_IP/health
# or
curl https://api.yourdomain.com/health

# Test services endpoint
curl https://api.yourdomain.com/api/services

# Check PM2
pm2 status
pm2 logs ca-backend --lines 50

# Check Nginx
sudo systemctl status nginx
```

### Test File Upload

```bash
# From your local machine
curl -X POST https://api.yourdomain.com/api/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "userServiceId=1"
```

### Test from Frontend

1. Open your Amplify app
2. Login as user
3. Try uploading a document
4. Verify file appears in dashboard
5. Try downloading the file

---

## 📊 PART 7: MONITORING & MAINTENANCE

### View Logs

```bash
# Application logs
pm2 logs ca-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Application error logs
tail -f /var/www/ca-website/logs/error.log
```

### Disk Space Management

```bash
# Check disk usage
df -h

# Check uploads directory size
du -sh /var/www/ca-website/uploads/

# Clean old uploads (optional - be careful!)
find /var/www/ca-website/uploads -type f -mtime +90 -delete
```

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/www/ca-website/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="ca_website_prod"
DB_USER="ca_app_user"
DB_PASS="YOUR_PASSWORD"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$TIMESTAMP.sql
gzip $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Schedule daily backups
sudo crontab -e

# Add this line (daily at 2 AM):
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 🚨 TROUBLESHOOTING

### File Upload Fails

```bash
# Check uploads directory permissions
ls -la /var/www/ca-website/uploads/
chmod 755 /var/www/ca-website/uploads/

# Check disk space
df -h

# Check PM2 logs
pm2 logs ca-backend | grep -i upload
```

### Database Connection Error

```bash
# Test MySQL connection
mysql -u ca_app_user -p ca_website_prod

# Check DATABASE_URL in .env
cat /var/www/ca-website/.env | grep DATABASE_URL

# Restart application
pm2 restart ca-backend
```

### 500 Errors

```bash
# Regenerate Prisma Client
cd /var/www/ca-website
npx prisma generate
pm2 restart ca-backend

# Check logs
pm2 logs ca-backend --lines 100
```

### CORS Errors

```bash
# Verify CORS_ORIGIN in .env
cat /var/www/ca-website/.env | grep CORS_ORIGIN

# Should include your Amplify URL
# Update if needed and restart
pm2 restart ca-backend
```

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] MySQL database created and accessible
- [ ] EC2 instance running with Node.js, PM2, Nginx
- [ ] Application code deployed to `/var/www/ca-website`
- [ ] `.env` file configured with all variables
- [ ] Dependencies installed (`npm ci --omit=dev`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Migrations applied (`npx prisma migrate deploy`)
- [ ] Uploads directory created with correct permissions
- [ ] PM2 running application
- [ ] Nginx configured and running
- [ ] SSL certificate installed (if using domain)
- [ ] Frontend environment variables updated
- [ ] CORS configured correctly
- [ ] File upload tested
- [ ] Database backups scheduled
- [ ] Monitoring setup

---

## 🎉 COMPLETE!

Your backend is now running with:

✅ **MySQL Database** (production-ready)  
✅ **Local File Storage** (no AWS S3 needed)  
✅ **AWS Amplify Compatible** (CORS configured)  
✅ **Secure File Access** (authentication required)  
✅ **Production Ready** (PM2 + Nginx + SSL)  

**API Endpoints**:
- Health: `https://api.yourdomain.com/health`
- Services: `https://api.yourdomain.com/api/services`
- Upload: `https://api.yourdomain.com/api/documents/upload`
- Download: `https://api.yourdomain.com/api/documents/download-file/:id`

---

**Need Help?** Check the troubleshooting section or review logs.

**Next Steps**: Test all features from your Amplify frontend!
