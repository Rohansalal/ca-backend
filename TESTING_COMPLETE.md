# 🎯 API Testing Complete Setup

## Summary of Everything Created

### 1️⃣ Testing Scripts (Ready to Run)
- **test-api.ps1** - Full automated test with color output and detailed results
- **test-simple.ps1** - Simplified commands for quick testing
- **test-api.bat** - Batch script (for reference)

### 2️⃣ Testing Documentation  
- **START_HERE.md** - Quick start guide (READ FIRST!)
- **QUICK_TEST_GUIDE.md** - Visual reference and copy-paste commands
- **API_TESTING_GUIDE.md** - Complete detailed API documentation
- **TEST_SUMMARY.md** - Testing summary with all scenarios

### 3️⃣ Logging System
- **src/utils/logger.js** - Core logging utility
- **src/middleware/requestLogger.js** - HTTP request logging
- **LOGGING.md** - How to view and use logs

### 4️⃣ Updated Code
- **src/controllers/authController.js** - Auth event logging added
- **src/app.js** - Logger middleware integrated + /api/logs endpoint
- **.gitignore** - Logs directory excluded from Git

---

## 🚀 QUICK START (Copy & Paste)

### Terminal 1: Start Server
```powershell
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"
npm run dev
```

### Terminal 2: Run Test (CHOOSE ONE)

**Option A - Recommended (Automatic everything):**
```powershell
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"
.\test-api.ps1
```

**Option B - Simple (Copy-paste):**
```powershell
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"
.\test-simple.ps1
```

**Option C - Manual (3 steps):**
```powershell
# Step 1: Register
$r = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{name="John";email="john@test.com";phone="9876543210";password="Pass123"}|ConvertTo-Json)
$r
$uid=$r.userId

# Step 2: Verify  
$v = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{userId=$uid;type="email";otp="1234"}|ConvertTo-Json)
$v

# Step 3: Login
$l = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{email="john@test.com";password="Pass123"}|ConvertTo-Json)
$l
```

---

## 📊 What Gets Tested

```
✅ User Registration
   Input: name, email, phone, password
   Output: userId
   Log: registered in auth.log

✅ Email Verification  
   Input: userId, OTP="1234"
   Output: "verified successfully"
   Log: verification recorded in auth.log

✅ User Login
   Input: email, password
   Output: JWT token
   Log: login recorded in auth.log + access.log
```

---

## 📝 Expected Test Output

### Successful Register:
```json
{
  "message": "User registered successfully. Please verify email/phone.",
  "userId": 1
}
```

### Successful Verify:
```json
{
  "message": "email verified successfully"
}
```

### Successful Login:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John",
    "role": "USER"
  }
}
```

---

## 📂 Where Are The Logs?

After testing, find logs at:
```
backend/logs/
├── auth.log          ← LOGIN INFO HERE ⭐
├── access.log        ← HTTP REQUESTS
├── error.log         ← ERRORS
└── combined.log      ← EVERYTHING
```

### View Last 20 Auth Logs:
```powershell
Get-Content "logs\auth.log" -Tail 20
```

### View via API:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/logs/auth?lines=50"
```

---

## 🔍 What Gets Logged (Example)

### auth.log contains:
```
[2026-01-20T12:30:45.123Z] [AUTH] User REGISTER | 
  {"userId":1,"email":"john@test.com","status":"success"}

[2026-01-20T12:30:50.456Z] [AUTH] User VERIFY | 
  {"userId":1,"type":"email","status":"success"}

[2026-01-20T12:30:55.789Z] [AUTH] User LOGIN | 
  {"userId":1,"email":"john@test.com","status":"success","ipAddress":"127.0.0.1"}
```

### access.log contains:
```
[2026-01-20T12:30:45.123Z] [ACCESS] POST /api/auth/register | 
  {"statusCode":201,"duration":"45ms"}

[2026-01-20T12:30:50.456Z] [ACCESS] POST /api/auth/verify | 
  {"statusCode":200,"duration":"32ms"}

[2026-01-20T12:30:55.789Z] [ACCESS] POST /api/auth/login | 
  {"statusCode":200,"duration":"65ms","userId":1}
```

---

## ✅ Complete Test Checklist

After running tests, verify:

### Registration Test:
- [ ] User created successfully
- [ ] userId returned
- [ ] auth.log has REGISTER entry
- [ ] access.log has POST request

### Verification Test:
- [ ] Email verified successfully  
- [ ] OTP "1234" accepted
- [ ] auth.log has VERIFY entry
- [ ] access.log has POST request

### Login Test:
- [ ] Login successful
- [ ] JWT token returned
- [ ] User info returned (id, name, role)
- [ ] auth.log has LOGIN entry
- [ ] access.log has status 200
- [ ] IP address logged

### Error Tests:
- [ ] Wrong password → "Invalid credentials"
- [ ] No verification → "Email not verified"
- [ ] Duplicate email → "Already exists"
- [ ] Wrong OTP → "Invalid OTP"

---

## 🎓 What You'll Learn

1. **Registration flow** - How users are created
2. **Verification system** - OTP validation
3. **Login system** - Email/password authentication
4. **JWT tokens** - How token-based auth works
5. **Logging system** - Complete audit trail
6. **Error handling** - Proper error responses
7. **Security** - Password hashing, verification required

---

## 🔧 Test Data

```
Test User:
  Name: John
  Email: john@test.com
  Phone: 9876543210
  Password: Pass123
  OTP: 1234 (hardcoded for testing)
```

---

## 📚 Documentation Files

| File | Purpose | Read When |
|------|---------|-----------|
| START_HERE.md | Quick overview | First |
| QUICK_TEST_GUIDE.md | Copy-paste commands | Need examples |
| API_TESTING_GUIDE.md | Complete reference | Need details |
| TEST_SUMMARY.md | Testing summary | Planning tests |
| LOGGING.md | Log system docs | Want log details |

---

## 🎉 You're All Set!

Everything is ready:
- ✅ API endpoints working
- ✅ Test scripts created  
- ✅ Logging system active
- ✅ Documentation complete

**Start testing now:**

```powershell
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"
.\test-api.ps1
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" | Start server: `npm run dev` in separate terminal |
| "Email not verified" error | Run verify step first with OTP "1234" |
| "Already exists" error | Use different email in tests |
| No logs created | Restart server, check status is 200 |
| JSON parse error | Use PowerShell (not cmd.exe) |

---

## 🚀 Next Steps

1. Run one of the test scripts above
2. Check the logs for recorded events
3. Understand the complete auth flow
4. Try error scenarios
5. Build your frontend using the JWT token

---

**Happy Testing! 🎉**

Questions? Check the documentation files in the backend folder.
