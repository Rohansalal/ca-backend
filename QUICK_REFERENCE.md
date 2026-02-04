# 📋 TESTING QUICK REFERENCE CARD

## 🚀 RUN TEST NOW (Choose One)

### Option 1: Automated (Recommended)
```powershell
.\test-api.ps1
```

### Option 2: Simple Commands
```powershell
.\test-simple.ps1
```

### Option 3: Paste These 3 Commands
```powershell
# 1. Register
$r = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{name="Test";email="test@email.com";phone="9876543210";password="Pass123"}|ConvertTo-Json)
$uid = $r.userId

# 2. Verify  
$v = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{userId=$uid;type="email";otp="1234"}|ConvertTo-Json)

# 3. Login
$l = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{email="test@email.com";password="Pass123"}|ConvertTo-Json)
$l.token
```

---

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new user |
| `/api/auth/verify` | POST | Verify email with OTP |
| `/api/auth/login` | POST | Login and get token |
| `/api/logs/auth` | GET | View auth logs |
| `/api/logs/access` | GET | View access logs |

---

## 📝 Request Examples

### Register
```json
POST /api/auth/register
{
  "name": "John",
  "email": "john@test.com",
  "phone": "9876543210",
  "password": "Pass123"
}
```

### Verify
```json
POST /api/auth/verify
{
  "userId": 1,
  "type": "email",
  "otp": "1234"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "john@test.com",
  "password": "Pass123"
}
```

---

## ✅ Success Responses

### Register ✓
```json
{
  "message": "User registered successfully. Please verify email/phone.",
  "userId": 1
}
```

### Verify ✓
```json
{
  "message": "email verified successfully"
}
```

### Login ✓
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John",
    "role": "USER"
  }
}
```

---

## ❌ Error Responses

### Invalid Credentials
```json
{
  "error": "Invalid credentials"
}
```

### Email Not Verified
```json
{
  "error": "Email not verified"
}
```

### Duplicate Email
```json
{
  "error": "Email or Phone already exists"
}
```

### Invalid OTP
```json
{
  "error": "Invalid OTP"
}
```

---

## 🔍 View Logs

### View Last 20 Auth Logs
```powershell
Get-Content "logs\auth.log" -Tail 20
```

### View Last 50 Access Logs
```powershell
Get-Content "logs\access.log" -Tail 50
```

### Search for Failed Logins
```powershell
Select-String "LOGIN_FAILED" "logs\auth.log"
```

### Via API
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/logs/auth?lines=50"
```

---

## 📂 Log File Locations

```
backend/logs/
├── auth.log       ← User login/register/verify
├── access.log     ← All HTTP requests
├── error.log      ← Errors only
└── combined.log   ← Everything
```

---

## 🧪 Test Scenarios

| Scenario | Input | Expected |
|----------|-------|----------|
| Register | valid data | userId |
| Verify | correct OTP | success |
| Login | valid email/pass | JWT token |
| Login | wrong password | error |
| Login | unverified email | error |
| Register | duplicate email | error |
| Verify | wrong OTP | error |

---

## 🎯 Test Checklist

- [ ] Server running (`npm run dev`)
- [ ] Run test script
- [ ] Get userId from register
- [ ] Verify with OTP "1234"
- [ ] Login successfully
- [ ] Get JWT token
- [ ] Check auth.log
- [ ] Check access.log

---

## 💾 Test Data

```
Email: test@email.com
Phone: 9876543210
Name: Test
Password: Pass123
OTP: 1234
```

---

## 🚀 After Login

Save the JWT token:
```powershell
$token = $l.token
Write-Host $token
```

Use for protected requests:
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/services" `
    -Headers $headers
```

---

## 📞 Quick Help

**Server won't start?** → Check port 5000 not in use  
**Connection refused?** → Start server in separate terminal  
**Email not verified?** → Run verify step with OTP "1234"  
**Duplicate email?** → Use different email in test  
**No logs?** → Restart server after changes  

---

## 📚 Read These Files

- `START_HERE.md` - Overview
- `QUICK_TEST_GUIDE.md` - Examples
- `API_TESTING_GUIDE.md` - Details
- `LOGGING.md` - Log system

---

**Ready? Run: `.\test-api.ps1`** 🚀
