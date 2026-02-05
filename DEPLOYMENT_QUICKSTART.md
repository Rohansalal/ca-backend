# 🚀 DEPLOYMENT QUICK START

This is a condensed guide to get you deploying ASAP.

---

## ⚡ STEP 1: Generate JWT Secrets (2 minutes)

```bash
# Run this in your backend folder
node scripts/generate-jwt-secrets.js
```

**Copy the output** (you'll need it for .env)

---

## ⚡ STEP 2: Setup GitHub Secrets (5 minutes)

Go to: **GitHub → Your Repo → Settings → Secrets → Actions**

Add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | Entire contents of your .pem file |
| `ENV_FILE` | Your complete .env file content (see template below) |

### ENV_FILE Template:

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

DATABASE_URL="mysql://ca_app_user:YOUR_PASSWORD@YOUR_VPS_IP:3306/ca_website_prod"

JWT_SECRET=<paste from step 1>
ADMIN_JWT_SECRET=<paste from step 1>

RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET
RAZORPAY_WEBHOOK_SECRET=<paste from step 1>

CORS_ORIGIN=https://your-amplify.amplifyapp.com
FRONTEND_URL=https://your-amplify.amplifyapp.com

AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
AWS_REGION=ap-south-1
S3_BUCKET_NAME=ca-website-docs

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

ADMIN_EMAIL=admin@yourdomain.com
```

---

## ⚡ STEP 3: First Deployment (10 minutes)

**SSH to EC2**:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

**Setup application**:

```bash
cd /var/www/ca-website

# Clone repository
git clone https://github.com/YOUR_USERNAME/ca-website-backend.git .

# Install dependencies
npm ci --omit=dev

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start src/server.js --name ca-backend -i max
pm2 save

# Check status
pm2 status
pm2 logs ca-backend
```

---

## ⚡ STEP 4: Test Auto-Deploy

**On your local machine**:

```bash
# Make a change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deploy"
git push origin main
```

**Check GitHub Actions**:
- Go to GitHub → Actions tab
- Watch the deployment run
- Should complete in ~2-3 minutes

**Verify on EC2**:

```bash
pm2 logs ca-backend
# Should show restart message
```

---

## ✅ DONE!

From now on, every push to `main` automatically deploys to EC2!

### What Happens on Each Push:

1. Code pushed to GitHub
2. GitHub Actions triggered
3. Code deployed to EC2
4. Dependencies installed
5. Prisma Client generated
6. Migrations run
7. PM2 restarts app
8. Health check verified

### Common Commands:

```bash
# View logs
pm2 logs ca-backend

# Restart manually
pm2 restart ca-backend

# Check status
pm2 status

# SSH to server
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

## 🚨 Troubleshooting

### Deployment Failed?

1. **Check GitHub Actions logs**:
   - GitHub → Actions → Failed workflow
   - Read error message

2. **Check PM2 logs**:
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   pm2 logs ca-backend --lines 100
   ```

3. **Common fixes**:
   ```bash
   # Regenerate Prisma
   cd /var/www/ca-website
   npx prisma generate
   pm2 restart ca-backend
   
   # Check .env file
   cat /var/www/ca-website/.env
   ```

### Application Not Working?

```bash
# Test health endpoint
curl http://YOUR_EC2_IP/health

# If failed, check:
pm2 status          # Is it running?
pm2 logs ca-backend # Any errors?
sudo systemctl status nginx  # Is Nginx running?
```

---

## 📚 Full Documentation

For complete details, see: `EC2_DEPLOYMENT_CICD.md`

---

**Happy Deploying! 🎉**
