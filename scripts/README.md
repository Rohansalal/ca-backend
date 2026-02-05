# 🛠️ Deployment Scripts

Helper scripts for deployment and maintenance.

---

## 📜 Available Scripts

### 1. `generate-jwt-secrets.js`

Generates secure JWT secrets for production use.

**Usage**:
```bash
node scripts/generate-jwt-secrets.js
```

**Output**:
- JWT_SECRET (128 characters)
- ADMIN_JWT_SECRET (128 characters)
- RAZORPAY_WEBHOOK_SECRET (64 characters)

**When to use**:
- Initial production setup
- When rotating secrets
- After a security incident

---

### 2. `deploy-test.sh`

Runs pre-deployment checks before pushing to GitHub.

**Usage**:
```bash
bash scripts/deploy-test.sh
```

**Checks**:
- ✅ Node.js version
- ✅ Dependencies installation
- ✅ Prisma schema validation
- ✅ Required files exist
- ✅ Code linting (if configured)
- ✅ Tests (if configured)

**When to use**:
- Before every `git push`
- To verify local setup
- Before major releases

---

### 3. `check-env.sh`

Validates environment variables are correctly configured.

**Usage**:
```bash
bash scripts/check-env.sh
```

**Checks**:
- ✅ All required variables exist
- ✅ JWT secrets are long enough
- ✅ JWT secrets are different
- ✅ DATABASE_URL format is correct
- ✅ NODE_ENV is set correctly

**When to use**:
- After creating .env file
- When debugging environment issues
- Before deployment

---

## 🚀 Typical Workflow

### Development

```bash
# 1. Make your code changes
# 2. Test locally
npm run dev

# 3. Run pre-deployment checks
bash scripts/deploy-test.sh

# 4. Commit and push
git add .
git commit -m "Your changes"
git push origin main
```

### Initial Production Setup

```bash
# 1. Generate secrets
node scripts/generate-jwt-secrets.js

# 2. Create .env file (copy .env.example)
# 3. Fill in all values

# 4. Validate environment
bash scripts/check-env.sh

# 5. Deploy (automatic via GitHub Actions)
git push origin main
```

---

## 📝 Notes

- All scripts assume you're running from the **backend root directory**
- Scripts use bash - on Windows, use Git Bash or WSL
- For production, these scripts run automatically on EC2 via GitHub Actions

---

## 🔒 Security

- **NEVER** commit `.env` files
- **NEVER** share JWT secrets
- **ALWAYS** use different secrets for dev/prod
- **ROTATE** secrets regularly (every 90 days)

---

## 🐛 Troubleshooting

### "Permission denied" on Linux/Mac

```bash
chmod +x scripts/*.sh
```

### Scripts not found

```bash
# Ensure you're in the backend root directory
cd /path/to/backend
ls scripts/
```

---

**Need more help?** See `EC2_DEPLOYMENT_CICD.md` for complete documentation.
