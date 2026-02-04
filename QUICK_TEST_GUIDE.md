# Quick API Testing - Visual Guide

## 📋 Test Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    COMPLETE AUTH FLOW TEST                        │
└──────────────────────────────────────────────────────────────────┘

[STEP 1] REGISTER USER
  ├─ Endpoint: POST /api/auth/register
  ├─ Input: name, email, phone, password
  └─ Output: userId
      ↓
[STEP 2] VERIFY EMAIL
  ├─ Endpoint: POST /api/auth/verify
  ├─ Input: userId, type="email", otp="1234"
  └─ Output: "email verified successfully"
      ↓
[STEP 3] LOGIN
  ├─ Endpoint: POST /api/auth/login
  ├─ Input: email, password
  └─ Output: JWT token + user info
      ↓
[STEP 4] USE TOKEN
  ├─ Include in Authorization header
  ├─ Access protected endpoints
  └─ Get resources with authentication
      ↓
[LOGS] VIEW ACTIVITY
  ├─ Location: backend/logs/auth.log
  ├─ Location: backend/logs/access.log
  └─ View via API: GET /api/logs/auth
```

---

## 🚀 Quick Start (Copy-Paste Ready)

### Open PowerShell and run these commands one by one:

#### Command 1: REGISTER
```powershell
$reg = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{name="John";email="john@test.com";phone="9876543210";password="Pass123"} | ConvertTo-Json)
$reg
$uid = $reg.userId
```

#### Command 2: VERIFY EMAIL
```powershell
$verify = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{userId=$uid;type="email";otp="1234"} | ConvertTo-Json)
$verify
```

#### Command 3: LOGIN
```powershell
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{email="john@test.com";password="Pass123"} | ConvertTo-Json)
$login
```

#### Command 4: VIEW TOKEN
```powershell
$login.token
```

---

## 📊 Test Cases Checklist

### ✅ Positive Tests (Should Succeed)
- [ ] Register new user with valid data
- [ ] Verify email with correct OTP (1234)
- [ ] Login with correct email and password
- [ ] Access protected endpoints with JWT token

### ❌ Negative Tests (Should Fail)
- [ ] Register with duplicate email (should reject)
- [ ] Register with duplicate phone (should reject)
- [ ] Login without verifying email (should reject)
- [ ] Login with wrong password (should reject)
- [ ] Login with non-existent email (should reject)
- [ ] Verify with wrong OTP (should reject)

---

## 🔍 Expected Responses

### ✅ Successful Register
```json
Status: 201 Created
{
  "message": "User registered successfully. Please verify email/phone.",
  "userId": 1
}
```

### ✅ Successful Verify
```json
Status: 200 OK
{
  "message": "email verified successfully"
}
```

### ✅ Successful Login
```json
Status: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John",
    "role": "USER"
  }
}
```

### ❌ Invalid Credentials
```json
Status: 400 Bad Request
{
  "error": "Invalid credentials"
}
```

### ❌ Email Not Verified
```json
Status: 403 Forbidden
{
  "error": "Email not verified"
}
```

### ❌ Duplicate Email
```json
Status: 400 Bad Request
{
  "error": "Email or Phone already exists"
}
```

---

## 📝 Test Data

**Test User:**
- Name: `John`
- Email: `john@test.com`
- Phone: `9876543210`
- Password: `Pass123`
- OTP: `1234`

---

## 📁 Log File Locations

After testing, check logs at:

```
backend/logs/
├── auth.log          ← Login/Register/Verify attempts
├── access.log        ← HTTP requests
├── error.log         ← Errors
└── combined.log      ← Everything
```

**View logs:**
```powershell
# Last 20 logins
Get-Content "logs\auth.log" -Tail 20

# Search for failures
Select-String "FAILED" "logs\auth.log"

# View all access
Get-Content "logs\access.log" -Tail 50
```

---

## 🎯 What Gets Logged

When you run these tests, the following gets logged:

**auth.log entries:**
```
[AUTH] User REGISTER - john@test.com registered
[AUTH] User VERIFY - Email verified for user 1
[AUTH] User LOGIN - User 1 logged in from IP 127.0.0.1
```

**access.log entries:**
```
[ACCESS] POST /api/auth/register - 201 (45ms)
[ACCESS] POST /api/auth/verify - 200 (32ms)
[ACCESS] POST /api/auth/login - 200 (65ms)
```

---

## ⚡ Try the Automated Test Script

Instead of running commands manually, run:

```powershell
cd backend
.\test-api.ps1
```

This will automatically:
1. Register a test user
2. Verify email
3. Login
4. Display results
5. Show logs

---

## 🐛 Troubleshooting

**Problem:** "Connection refused"
- Solution: Make sure server is running → `npm run dev`

**Problem:** "Email or Phone already exists"
- Solution: Use a different email/phone in tests

**Problem:** "Email not verified"
- Solution: Run Step 2 (verify) before Step 3 (login)

**Problem:** "Invalid OTP"
- Solution: OTP is hardcoded as "1234" for testing

---

## 🎓 Learning Path

1. **Understand the flow** - Read this guide first
2. **Run manual tests** - Execute commands one by one
3. **Check logs** - Verify all activities are logged
4. **Run automated script** - Use test-api.ps1 for full flow
5. **Analyze logs** - Learn what data is being tracked

---

**Ready to test? Start with Command 1 above!** ✨
