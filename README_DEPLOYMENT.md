# 🚀 CA WEBSITE BACKEND - DEPLOYMENT GUIDE

**Welcome!** This is your complete production deployment package.

---

## 📚 DOCUMENTATION INDEX

### 🎯 **START HERE** → Choose Your Path:

#### 1️⃣ **Complete EC2 Deployment with CI/CD** (RECOMMENDED)
   
   Read: **`EC2_DEPLOYMENT_CICD.md`**
   
   **What you get**:
   - ✅ Full EC2 instance setup
   - ✅ Environment variables configuration
   - ✅ JWT token generation
   - ✅ GitHub Actions CI/CD pipeline
   - ✅ **Auto-deployment on every push to main**
   - ✅ Monitoring and backup scripts
   
   **Best for**: 
   - First-time deployment
   - Setting up CI/CD automation
   - Professional production setup

---

#### 2️⃣ **Quick Deployment** (For Experienced Users)
   
   Read: **`DEPLOYMENT_QUICKSTART.md`**
   
   **What you get**:
   - ⚡ Essential steps only
   - ⚡ Quick reference format
   - ⚡ 15-minute setup
   
   **Best for**:
   - Re-deployment
   - Quick reference
   - Users who've done this before

---

#### 3️⃣ **GitHub Actions Setup** (CI/CD Configuration)
   
   Read: **`GITHUB_ACTIONS_SETUP.md`**
   
   **What you get**:
   - ✅ Step-by-step checklist
   - ✅ GitHub Secrets configuration
   - ✅ Workflow file setup
   - ✅ Troubleshooting guide
   
   **Best for**:
   - Setting up auto-deployment
   - Configuring GitHub Actions
   - Understanding CI/CD workflow

---

#### 4️⃣ **Manual Production Deployment** (Alternative Method)
   
   Read: **`PRODUCTION_DEPLOYMENT.md`**
   
   **What you get**:
   - 📦 MySQL database setup on VPS
   - 📦 EC2 instance configuration
   - 📦 SSL certificate setup
   - 📦 Razorpay webhook configuration
   
   **Best for**:
   - Manual deployment preference
   - No CI/CD needed
   - Advanced users

---

## 🛠️ HELPER FILES

### Scripts (`scripts/` folder)

1. **`generate-jwt-secrets.js`** - Generate secure JWT secrets
   ```bash
   node scripts/generate-jwt-secrets.js
   ```

2. **`deploy-test.sh`** - Pre-deployment validation
   ```bash
   bash scripts/deploy-test.sh
   ```

3. **`check-env.sh`** - Verify environment variables
   ```bash
   bash scripts/check-env.sh
   ```

4. **`README.md`** - Scripts documentation

---

### Configuration Templates

1. **`.env.example`** - Environment variables template
   - Copy this to create your `.env`
   - Fill in all values
   - Use `generate-jwt-secrets.js` for secrets

2. **`fix-prisma.bat`** - Fix Prisma Client issues
   - One-click Prisma troubleshooting
   - Use when you see "Unknown field" errors

---

## 🎯 RECOMMENDED WORKFLOW

### For First-Time Deployment:

```
1. Read: EC2_DEPLOYMENT_CICD.md (30 minutes)
   ↓
2. Setup EC2 instance (45 minutes)
   ↓
3. Generate secrets: node scripts/generate-jwt-secrets.js
   ↓
4. Configure GitHub Actions: GITHUB_ACTIONS_SETUP.md
   ↓
5. First deployment (15 minutes)
   ↓
6. Test auto-deployment
   ↓
7. ✅ DONE! Push to main = auto deploy
```

### For Future Deployments:

```
1. Make code changes
   ↓
2. Test locally: npm run dev
   ↓
3. Validate: bash scripts/deploy-test.sh
   ↓
4. Commit & push to main
   ↓
5. ✅ GitHub Actions deploys automatically!
```

---

## ⚡ QUICK REFERENCE

### Essential Commands

| Task | Command |
|------|---------|
| Generate secrets | `node scripts/generate-jwt-secrets.js` |
| Pre-deploy check | `bash scripts/deploy-test.sh` |
| Check environment | `bash scripts/check-env.sh` |
| Fix Prisma | `fix-prisma.bat` |
| SSH to EC2 | `ssh -i key.pem ubuntu@YOUR_IP` |
| View logs | `pm2 logs ca-backend` |
| Restart app | `pm2 restart ca-backend` |

### Important Files Location

| File | Purpose |
|------|---------|
| `.env` | Production environment variables |
| `.github/workflows/deploy.yml` | CI/CD configuration |
| `scripts/` | Helper scripts |
| `prisma/schema.prisma` | Database schema |
| `src/server.js` | Application entry point |

---

## 📦 WHAT YOU NEED

Before starting deployment:

- [ ] AWS Account with EC2 access
- [ ] MySQL VPS (IP, username, password, database)
- [ ] Razorpay Live Account (Key ID, Secret, Webhook Secret)
- [ ] GitHub Account
- [ ] Domain name (optional but recommended)
- [ ] AWS S3 bucket (for file uploads)
- [ ] Gmail account with app password (for emails)

---

## 🚨 TROUBLESHOOTING

### Deployment Issues?

1. **500 Errors**: Run `fix-prisma.bat`
2. **Environment Issues**: Run `bash scripts/check-env.sh`
3. **GitHub Actions Fails**: Check `GITHUB_ACTIONS_SETUP.md` → Troubleshooting
4. **Database Connection**: Verify `DATABASE_URL` in `.env`

### Where to Find Help?

- **CI/CD Issues**: `GITHUB_ACTIONS_SETUP.md`
- **Environment Setup**: `.env.example` (has detailed comments)
- **Scripts Help**: `scripts/README.md`
- **General Deployment**: `EC2_DEPLOYMENT_CICD.md` → Part 8 (Troubleshooting)

---

## 📊 DEPLOYMENT FEATURES

### What You Get:

✅ **Automatic Deployment**
- Push to `main` = Auto deploy (2-3 minutes)
- Zero downtime
- Automatic backups before each deployment

✅ **Security**
- 128-character JWT secrets
- Separate admin authentication
- Rate limiting
- CORS protection
- Secure environment variables

✅ **Monitoring**
- PM2 process management
- Application logs
- Health check endpoint
- Error tracking

✅ **Backup & Recovery**
- Automatic code backups
- Database backup scripts
- Rollback workflow (manual)

✅ **Production Ready**
- Nginx reverse proxy
- SSL support
- MySQL database
- Razorpay live integration
- AWS S3 file storage

---

## 🎓 LEARNING PATH

### Beginner (You're new to deployment)

**Day 1-2**: Read all documentation
- `EC2_DEPLOYMENT_CICD.md`
- `GITHUB_ACTIONS_SETUP.md`

**Day 3-4**: Setup infrastructure
- Create EC2 instance
- Setup MySQL database
- Configure GitHub

**Day 5**: First deployment
- Follow `DEPLOYMENT_QUICKSTART.md`
- Test everything

---

### Intermediate (You've deployed before)

**Day 1**: Review and setup
- Skim `EC2_DEPLOYMENT_CICD.md`
- Setup EC2 and GitHub Actions
- First deployment

**Day 2**: Test and optimize
- Test auto-deployment
- Setup monitoring
- Configure backups

---

### Advanced (You know what you're doing)

**Hour 1**: Setup
- Create EC2
- Configure GitHub Actions
- Deploy

**Hour 2**: Verify
- Test auto-deployment
- Setup SSL
- Configure monitoring

---

## 📞 PACKAGE CONTENTS

### Documentation (8 files)
- `EC2_DEPLOYMENT_CICD.md` - **Main deployment guide**
- `DEPLOYMENT_QUICKSTART.md` - Quick reference
- `GITHUB_ACTIONS_SETUP.md` - CI/CD setup checklist
- `PRODUCTION_DEPLOYMENT.md` - Alternative deployment method
- `DEPLOYMENT_PACKAGE_README.md` - Package overview
- `.env.example` - Environment template
- `scripts/README.md` - Scripts documentation
- `README_DEPLOYMENT.md` - **This file**

### Scripts (4 files)
- `generate-jwt-secrets.js` - Secret generation
- `deploy-test.sh` - Pre-deployment checks
- `check-env.sh` - Environment validation
- `fix-prisma.bat` - Prisma troubleshooting

### Configuration
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules
- Workflow templates (in documentation)

---

## ✅ POST-DEPLOYMENT CHECKLIST

After successful deployment:

- [ ] Application running on EC2
- [ ] Health endpoint accessible
- [ ] Auto-deployment tested
- [ ] Database connected
- [ ] Razorpay integration working
- [ ] Admin panel accessible
- [ ] File uploads working
- [ ] Emails sending
- [ ] SSL configured (if using domain)
- [ ] Backups scheduled
- [ ] Monitoring setup

---

## 🎉 YOU'RE READY!

Choose your path above and start deploying!

**Recommended for most users**: 
→ **`EC2_DEPLOYMENT_CICD.md`**

**Need quick help**:
→ **`DEPLOYMENT_QUICKSTART.md`**

**GitHub Actions only**:
→ **`GITHUB_ACTIONS_SETUP.md`**

---

**Project**: CA Website - Precision Associates  
**Status**: ✅ Production Ready  
**Created**: 2026-02-05  
**Version**: 1.0  

---

**Questions?** Check the troubleshooting sections in each guide.

**Happy Deploying! 🚀**
