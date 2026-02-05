# ✅ GITHUB ACTIONS SETUP CHECKLIST

Follow this step-by-step to configure CI/CD for auto-deployment.

---

## 📋 PREREQUISITES

- [ ] GitHub account
- [ ] GitHub repository created for backend
- [ ] EC2 instance running
- [ ] EC2 .pem key file downloaded
- [ ] `.env` file prepared (use `.env.example` as template)

---

## STEP 1: CREATE WORKFLOW FILES

### 1.1 Create Directory Structure

In your backend project:

```bash
mkdir -p .github/workflows
```

### 1.2 Create `deploy.yml`

Create file: `.github/workflows/deploy.yml`

**Copy content from**: `EC2_DEPLOYMENT_CICD.md` → Part 5 → Step 5.2

**Important**: Update line 43 with your GitHub username:
```yaml
git clone https://github.com/YOUR_USERNAME/ca-website-backend.git temp_repo
```

- [ ] File created
- [ ] GitHub username updated
- [ ] File committed to repository

---

## STEP 2: SETUP GITHUB SECRETS

### 2.1 Navigate to Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Scroll to **Security** section
4. Click **Secrets and variables** → **Actions**
5. Click **New repository secret**

### 2.2 Add Secret 1: EC2_HOST

- **Name**: `EC2_HOST`
- **Value**: Your EC2 public IP (e.g., `13.232.45.123`)
- **Where to find**: AWS Console → EC2 → Instances → Your instance → Public IPv4

- [ ] EC2_HOST added

### 2.3 Add Secret 2: EC2_USERNAME

- **Name**: `EC2_USERNAME`
- **Value**: `ubuntu` (default for Ubuntu AMI)

- [ ] EC2_USERNAME added

### 2.4 Add Secret 3: EC2_SSH_KEY

- **Name**: `EC2_SSH_KEY`
- **Value**: Entire contents of your `.pem` file

**How to get**:
1. Open your `ca-website-ec2-key.pem` file in a text editor
2. Copy **everything** including:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   ...entire key content...
   ...
   -----END RSA PRIVATE KEY-----
   ```
3. Paste into GitHub secret

⚠️ **IMPORTANT**: 
- Include the BEGIN and END lines
- Don't add any extra spaces or newlines
- Keep this secret safe!

- [ ] EC2_SSH_KEY added
- [ ] Verified BEGIN/END lines included

### 2.5 Add Secret 4: ENV_FILE

- **Name**: `ENV_FILE`
- **Value**: Your complete production `.env` file content

**How to prepare**:

1. **Copy** `.env.example` to create your `.env`
2. **Fill in** all values:
   - Database credentials
   - JWT secrets (use `generate-jwt-secrets.js`)
   - Razorpay keys
   - AWS credentials
   - SMTP settings
3. **Copy entire** `.env` content
4. **Paste** into GitHub secret

**Example format**:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="mysql://user:pass@ip:3306/db"
JWT_SECRET=your_128_char_secret_here
...
```

- [ ] ENV_FILE created
- [ ] All values filled in
- [ ] JWT secrets generated and added
- [ ] Database URL correct
- [ ] Razorpay keys added

---

## STEP 3: ADD SSH DEPLOY KEY

### 3.1 Generate SSH Key on EC2

SSH to your EC2:
```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

Generate deploy key:
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy_key -N ""
cat ~/.ssh/github_deploy_key.pub
```

Copy the output (public key).

### 3.2 Add to GitHub

1. GitHub → Your repository → **Settings**
2. **Deploy keys** (left sidebar)
3. **Add deploy key**
4. **Title**: `EC2 Deployment Key`
5. **Key**: Paste the public key
6. ✅ **Allow write access** (check this box!)
7. **Add key**

- [ ] Deploy key added to GitHub
- [ ] Write access enabled

### 3.3 Configure Git on EC2

Still on EC2:
```bash
# Configure SSH to use deploy key
cat >> ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  IdentityFile ~/.ssh/github_deploy_key
  StrictHostKeyChecking no
EOF

chmod 600 ~/.ssh/config

# Test connection
ssh -T git@github.com
# Should see: "Hi username! You've successfully authenticated..."
```

- [ ] SSH config created
- [ ] GitHub connection tested

---

## STEP 4: VERIFY SECRETS

Go back to: **Settings → Secrets and variables → Actions**

You should see 4 secrets:
- [ ] EC2_HOST
- [ ] EC2_USERNAME  
- [ ] EC2_SSH_KEY
- [ ] ENV_FILE

All should show "Updated X minutes ago"

---

## STEP 5: COMMIT WORKFLOW FILES

On your **local machine**:

```bash
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"

# Check workflow files exist
ls .github/workflows/

# Should see:
# deploy.yml

# Add to git
git add .github/workflows/deploy.yml
git add .env.example
git add scripts/

# Commit
git commit -m "Add CI/CD pipeline with GitHub Actions"

# Push to GitHub
git push origin main
```

- [ ] Workflow files committed
- [ ] Pushed to GitHub

---

## STEP 6: FIRST MANUAL DEPLOYMENT

Before testing auto-deployment, do one manual deployment on EC2:

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Go to app directory
cd /var/www/ca-website

# Clone repository (first time only)
git clone git@github.com:YOUR_USERNAME/ca-website-backend.git .

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
pm2 logs ca-backend --lines 50
```

- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Prisma Client generated
- [ ] Migrations run
- [ ] PM2 started
- [ ] Application running (check logs)

---

## STEP 7: TEST AUTO-DEPLOYMENT

### 7.1 Make a Test Change

On your **local machine**:

```bash
# Make a small change
echo "# Deployment Test - $(Get-Date)" >> README.md

# Commit
git add README.md
git commit -m "test: auto-deployment"

# Push to GitHub
git push origin main
```

- [ ] Test commit pushed

### 7.2 Watch GitHub Actions

1. Go to GitHub → Your repository
2. Click **Actions** tab (top menu)
3. You should see "Deploy to EC2" workflow starting
4. Click on it to watch progress

**Expected steps**:
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install dependencies locally
- ✅ Configure SSH
- ✅ Deploy to EC2
- ✅ Upload .env file
- ✅ Restart application
- ✅ Health check

**Total time**: ~2-3 minutes

- [ ] Workflow started
- [ ] All steps completed successfully
- [ ] Health check passed

### 7.3 Verify on EC2

While workflow is running, SSH to EC2 and watch logs:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
pm2 logs ca-backend
```

You should see:
- Application restarting
- New code being deployed
- Server starting successfully

- [ ] Logs show successful deployment
- [ ] No errors in logs

---

## STEP 8: FINAL VERIFICATION

### 8.1 Test Health Endpoint

```bash
# From your local machine
curl http://YOUR_EC2_IP/health
```

Should return:
```json
{
  "status": "Server is running",
  "timestamp": "..."
}
```

- [ ] Health endpoint works

### 8.2 Test API Endpoints

```bash
# Test services endpoint
curl http://YOUR_EC2_IP/api/services
```

- [ ] API endpoints working

### 8.3 Check PM2 Status

On EC2:
```bash
pm2 status
```

Should show:
- `ca-backend` status: `online`
- Restart count increased
- Uptime reset

- [ ] PM2 shows application running

---

## ✅ SETUP COMPLETE!

Congratulations! Your CI/CD pipeline is working!

### What Happens Now:

Every time you push to `main`:
1. GitHub Actions automatically runs
2. Code is deployed to EC2
3. Application restarts with new code
4. Health check verifies it's working

### Next Deployment:

```bash
# Make changes
# Test locally: npm run dev

# Commit and push
git add .
git commit -m "Your changes"
git push origin main

# GitHub Actions deploys automatically!
```

---

## 🚨 TROUBLESHOOTING

### Workflow Fails at "Configure SSH"

**Problem**: EC2_SSH_KEY is incorrect

**Fix**:
1. Re-copy your entire .pem file
2. Update EC2_SSH_KEY secret
3. Ensure BEGIN/END lines are included

### Workflow Fails at "Deploy to EC2"

**Problem**: SSH connection failed

**Fix**:
1. Verify EC2_HOST is correct public IP
2. Check EC2 security group allows SSH (port 22)
3. Test manually: `ssh -i key.pem ubuntu@IP`

### Workflow Fails at "Health Check"

**Problem**: Application not starting

**Fix**:
1. SSH to EC2: `ssh -i key.pem ubuntu@IP`
2. Check logs: `pm2 logs ca-backend`
3. Check .env: `cat /var/www/ca-website/.env`
4. Restart: `pm2 restart ca-backend`

### Application Won't Start

**Problem**: Missing environment variables or Prisma error

**Fix**:
```bash
# On EC2
cd /var/www/ca-website

# Check .env exists
ls -la .env

# Regenerate Prisma
npx prisma generate

# Restart
pm2 restart ca-backend
pm2 logs ca-backend --lines 100
```

---

## 📞 NEED HELP?

- **Full documentation**: `EC2_DEPLOYMENT_CICD.md`
- **Quick reference**: `DEPLOYMENT_QUICKSTART.md`
- **Scripts help**: `scripts/README.md`

---

**Setup Date**: _________________  
**Setup By**: ___________________  
**EC2 IP**: ____________________  
**Status**: ✅ WORKING / ⚠️ PENDING  

---

**Happy Deploying! 🚀**
