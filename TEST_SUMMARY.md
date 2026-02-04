# 🧪 API Testing - Complete Guide

## Files Created for Testing

| File | Purpose | How to Use |
|------|---------|-----------|
| `test-api.ps1` | Full automated test with formatting | `.\test-api.ps1` |
| `test-simple.ps1` | Simple copy-paste test commands | `.\test-simple.ps1` |
| `QUICK_TEST_GUIDE.md` | Visual quick reference | Read in VS Code |
| `API_TESTING_GUIDE.md` | Complete detailed guide | Reference document |

---

## 🚀 Fastest Way to Test (30 seconds)

### Option 1: Run Automated Script
```powershell
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"
.\test-api.ps1
```

This will:
- ✅ Register a test user
- ✅ Verify email
- ✅ Login successfully
- ✅ Show JWT token
- ✅ Display logs

---

### Option 2: Manual Commands

**Open PowerShell and run these 3 commands:**

**Command 1 - Register:**
```powershell
$r = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{name="Test";email="test@example.com";phone="9876543210";password="Pass123"}|ConvertTo-Json)
$r
$uid=$r.userId
```

**Command 2 - Verify:**
```powershell
$v = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{userId=$uid;type="email";otp="1234"}|ConvertTo-Json)
$v
```

**Command 3 - Login:**
```powershell
$l = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{email="test@example.com";password="Pass123"}|ConvertTo-Json)
$l
$l.token
```

---

## 📊 Test Scenarios

### Scenario 1: Successful Login
```
Input:
  - Email: test@example.com
  - Password: Pass123

Output:
  ✓ User ID
  ✓ JWT Token
  ✓ User Role (USER/ADMIN)
```

### Scenario 2: Failed Login (Wrong Password)
```
Input:
  - Email: test@example.com
  - Password: WrongPassword

Output:
  ✗ "Invalid credentials" error
```

### Scenario 3: Unverified Email
```
Input:
  - Register new user
  - Skip verification step
  - Try to login

Output:
  ✗ "Email not verified" error
```

### Scenario 4: Duplicate Email
```
Input:
  - Register with test@example.com
  - Register again with same email

Output:
  ✗ "Email or Phone already exists" error
```

---

## 📝 What Gets Logged

### auth.log - User Authentication
```
[2026-01-20T12:30:45.123Z] [AUTH] User REGISTER | 
  {userId:1, email:"test@example.com", status:"success"}

[2026-01-20T12:30:50.456Z] [AUTH] User VERIFY | 
  {userId:1, type:"email", status:"success"}

[2026-01-20T12:30:55.789Z] [AUTH] User LOGIN | 
  {userId:1, email:"test@example.com", status:"success", ipAddress:"127.0.0.1"}
```

### access.log - HTTP Requests
```
[2026-01-20T12:30:45.123Z] [ACCESS] POST /api/auth/register | 
  {statusCode:201, duration:"45ms"}

[2026-01-20T12:30:50.456Z] [ACCESS] POST /api/auth/verify | 
  {statusCode:200, duration:"32ms"}

[2026-01-20T12:30:55.789Z] [ACCESS] POST /api/auth/login | 
  {statusCode:200, duration:"65ms", userId:1}
```

---

## 🔍 View Logs After Testing

### View via API
```powershell
# Get recent auth logs
curl http://localhost:5000/api/logs/auth

# Get last 50 lines
curl http://localhost:5000/api/logs/auth?lines=50
```

### View Files Directly
```powershell
# PowerShell - Last 20 lines
Get-Content "logs\auth.log" -Tail 20

# PowerShell - Search for failures
Select-String "FAILED" "logs\auth.log"

# PowerShell - Follow in real-time
Get-Content "logs\auth.log" -Tail 0 -Wait
```

---

## ✅ Checklist for Testing

After running tests, verify:

- [ ] Server started without errors
- [ ] Registration created new user
- [ ] User ID was returned
- [ ] Email verification succeeded
- [ ] Login returned JWT token
- [ ] Login returned user info
- [ ] Logs were created in `backend/logs/`
- [ ] `auth.log` contains login records
- [ ] `access.log` contains HTTP requests
- [ ] Failed login attempt is logged

---

## 🎯 Test Data Ready

Use these for testing:

```
User 1:
  Email: test@example.com
  Phone: 9876543210
  Password: Pass123
  OTP: 1234

User 2:
  Email: john@example.com
  Phone: 9988776655
  Password: SecurePassword123
  OTP: 1234

User 3:
  Email: alice@example.com
  Phone: 9988774433
  Password: AlicePass123
  OTP: 1234
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Connection refused | Start server: `npm run dev` |
| "Email not verified" | Run verify step first |
| "Email already exists" | Use different email |
| JSON parse error | Use PowerShell (not cmd.exe) |
| No logs created | Restart server |
| Token expired | Tokens last 24 hours |

---

## 📂 Log Locations

```
backend/
├── logs/
│   ├── auth.log          ← Login/Register info
│   ├── access.log        ← HTTP requests
│   ├── error.log         ← Errors
│   ├── combined.log      ← Everything
│   └── queries.log       ← Database queries
```

---

## 🎓 What You're Testing

| Component | What Happens |
|-----------|--------------|
| **Registration** | User data stored in database |
| **Verification** | Email/phone verified, flags set |
| **Login** | User authenticated, JWT token issued |
| **Logging** | All activities recorded with timestamp, IP, device |
| **Security** | Password hashed, token validated, verified required |

---

## Next: Use the JWT Token

Once you have a token:

```powershell
$token = "YOUR_JWT_TOKEN"

# Use for protected requests
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/services" `
    -Headers $headers
```

---

**Start testing now!** ✨
