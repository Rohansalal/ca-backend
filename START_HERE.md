# Complete Testing Summary

## 📋 What You Have Now

### Testing Files Created:
✅ `test-api.ps1` - Full automated test  
✅ `test-simple.ps1` - Simple copy-paste commands  
✅ `QUICK_TEST_GUIDE.md` - Visual reference  
✅ `API_TESTING_GUIDE.md` - Detailed guide  
✅ `TEST_SUMMARY.md` - This summary  

### Logging System:
✅ `logs/auth.log` - User login/register/verify  
✅ `logs/access.log` - All HTTP requests  
✅ `logs/error.log` - Errors  
✅ `logs/combined.log` - Everything  

### Code Updated:
✅ `src/utils/logger.js` - Logging utility  
✅ `src/middleware/requestLogger.js` - Request logging  
✅ `src/controllers/authController.js` - Auth logging  
✅ `src/app.js` - Logger integration + API endpoint  

---

## 🚀 Start Testing in 60 Seconds

### Step 1: Make sure server is running
```powershell
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"
npm run dev
```

### Step 2: Open NEW PowerShell window and run test

**Option A - Automated (Recommended):**
```powershell
.\test-api.ps1
```

**Option B - Simple Commands:**
```powershell
.\test-simple.ps1
```

**Option C - Manual (Line by line):**
```powershell
# Register
$r = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{name="Test";email="test@example.com";phone="9876543210";password="Pass123"}|ConvertTo-Json)
$r
$uid=$r.userId

# Verify
$v = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{userId=$uid;type="email";otp="1234"}|ConvertTo-Json)
$v

# Login
$l = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{email="test@example.com";password="Pass123"}|ConvertTo-Json)
$l
$l.token
```

---

## 📊 Test Results You'll See

### ✅ Registration Success
```json
{
  "message": "User registered successfully. Please verify email/phone.",
  "userId": 1
}
```

### ✅ Email Verification Success
```json
{
  "message": "email verified successfully"
}
```

### ✅ Login Success
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test",
    "role": "USER"
  }
}
```

---

## 🔍 Check Logs

### Method 1: View Files
```powershell
# Last 20 auth logs
Get-Content "logs\auth.log" -Tail 20

# Search for failed logins
Select-String "LOGIN_FAILED" "logs\auth.log"

# View access logs
Get-Content "logs\access.log" -Tail 20
```

### Method 2: Use API
```powershell
# Recent auth logs
Invoke-RestMethod -Uri "http://localhost:5000/api/logs/auth?lines=50"

# Recent access logs
Invoke-RestMethod -Uri "http://localhost:5000/api/logs/access?lines=50"
```

---

## 📋 Complete Test Checklist

Run through these scenarios:

### ✅ Scenario 1: Successful Flow
- [ ] Register user → Get userId
- [ ] Verify email with OTP "1234" → Success
- [ ] Login with email/password → Get JWT token
- [ ] Check auth.log has LOGIN entry
- [ ] Check access.log has POST requests

### ❌ Scenario 2: Failed Scenarios
- [ ] Try login with wrong password → "Invalid credentials"
- [ ] Try login without verification → "Email not verified"
- [ ] Try register duplicate email → "Already exists"
- [ ] Try verify with wrong OTP → "Invalid OTP"

### 📊 Scenario 3: Log Verification
- [ ] Open `logs/auth.log`
- [ ] Find register entry
- [ ] Find verify entry
- [ ] Find login entry
- [ ] Check IP address is logged
- [ ] Check timestamp is correct

---

## 🎯 Key Features Tested

✅ **User Registration** - Create new user with email/phone  
✅ **Email Verification** - OTP-based verification (mocked as "1234")  
✅ **User Login** - Authenticate with email/password  
✅ **JWT Token** - Generate secure token for 24 hours  
✅ **Logging** - Record all auth events with IP/device  
✅ **Error Handling** - Proper error messages for failures  

---

## 📁 Files to Check

After testing:

```
backend/
├── logs/
│   ├── auth.log          ← MOST IMPORTANT - Shows login info
│   ├── access.log        ← Shows HTTP requests with status codes
│   ├── error.log         ← Any errors that occurred
│   ├── combined.log      ← Full record of everything
│   └── queries.log       ← Database queries (dev only)
└── src/
    ├── utils/logger.js        ← Core logging logic
    ├── middleware/requestLogger.js ← HTTP logging
    └── controllers/authController.js ← Auth logging
```

---

## 🎓 Learning Outcomes

After testing, you'll understand:

1. **How registration works** - User data stored in SQLite
2. **How verification works** - OTP validation (mocked)
3. **How login works** - Email/password authentication
4. **How JWT works** - Token-based authentication
5. **What gets logged** - Complete audit trail
6. **How to view logs** - Via file or API
7. **Error handling** - Proper error responses
8. **Security** - Passwords hashed, tokens validated

---

## 🔧 Troubleshooting

### Issue: Server won't start
```
✗ Solution: Make sure port 5000 is not in use
✗ Alternative: Change PORT in .env file
```

### Issue: "Connection refused"
```
✗ Solution: Server must be running in separate terminal
✗ Run: npm run dev
```

### Issue: "Email not verified" error
```
✗ Solution: Must run verification step first
✗ Use OTP: 1234
```

### Issue: No logs created
```
✗ Solution: Restart server after code changes
✗ Solution: Make sure request was successful (200 status)
```

---

## 💾 Save Important Info

After successful login, save:

```
User Email: test@example.com
User ID: 1
Password: Pass123
JWT Token: [Long token string]
```

Use token for:
- Protected API requests
- Future logins
- Authorization headers

---

## 🎉 You're Ready!

All testing infrastructure is in place:

✅ API endpoints ready to test  
✅ Automated test scripts created  
✅ Logging system recording everything  
✅ Documentation provided  
✅ Error handling implemented  

**Start testing:** Run `.\test-api.ps1` now!

---

## Next Steps After Testing

1. **Verify logs** - Check what was recorded
2. **Test error cases** - Try invalid inputs
3. **View logs file** - Understand the data being captured
4. **Build frontend** - Use JWT token to authenticate requests
5. **Add more endpoints** - Use same logging pattern

---

**Questions?** Check the documentation files:
- Quick test: `QUICK_TEST_GUIDE.md`
- Detailed: `API_TESTING_GUIDE.md`
- Logging: `LOGGING.md`

Happy testing! 🚀
