# API Testing Guide - Manual Step-by-Step

## Prerequisites
- Server must be running: `npm run dev`
- Use PowerShell for testing (has better JSON support)

---

## STEP 1: Register a New User

**What:** Create a new user account with email, phone, name, and password

Open PowerShell and run:

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        name = "John Doe"
        email = "john@example.com"
        phone = "9876543210"
        password = "SecurePassword123"
    } | ConvertTo-Json)

$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "message": "User registered successfully. Please verify email/phone.",
  "userId": 1
}
```

**Save the userId** - You'll need it for the next step (in this example: `1`)

---

## STEP 2: Verify Email with OTP

**What:** Verify the user's email address using OTP (mocked as "1234")

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        userId = 1
        type = "email"
        otp = "1234"
    } | ConvertTo-Json)

$response | ConvertTo-Json
```

**Replace `userId: 1`** with the actual ID from Step 1

**Expected Response:**
```json
{
  "message": "email verified successfully"
}
```

---

## STEP 3: Login with Email & Password

**What:** Login using email and password to get JWT token

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "john@example.com"
        password = "SecurePassword123"
    } | ConvertTo-Json)

$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "role": "USER"
  }
}
```

**Save the token** - Use this for protected API requests

---

## Testing Scenarios

### ✅ Scenario 1: Successful Complete Flow
```powershell
# 1. Register
$reg = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        name = "Alice"
        email = "alice@test.com"
        phone = "9988776655"
        password = "MyPassword123"
    } | ConvertTo-Json)

$userId = $reg.userId
Write-Host "User ID: $userId"

# 2. Verify Email
$verify = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        userId = $userId
        type = "email"
        otp = "1234"
    } | ConvertTo-Json)

Write-Host $verify

# 3. Login
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "alice@test.com"
        password = "MyPassword123"
    } | ConvertTo-Json)

Write-Host "Login Token:"
Write-Host $login.token
```

---

### ❌ Scenario 2: Wrong Password
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "john@example.com"
        password = "WrongPassword123"
    } | ConvertTo-Json)
```

**Expected Error:**
```json
{
  "error": "Invalid credentials"
}
```

---

### ❌ Scenario 3: Email Not Verified
```powershell
# Try logging in without verifying email
# Register new user but skip verification
$reg = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        name = "Bob"
        email = "bob@test.com"
        phone = "9988774433"
        password = "BobPassword123"
    } | ConvertTo-Json)

# Try to login WITHOUT verifying email
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "bob@test.com"
        password = "BobPassword123"
    } | ConvertTo-Json)
```

**Expected Error:**
```json
{
  "error": "Email not verified"
}
```

---

### ❌ Scenario 4: Duplicate Email
```powershell
# Try registering with an existing email
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        name = "Duplicate User"
        email = "john@example.com"  # Already registered in Step 1
        phone = "9999999999"
        password = "AnotherPassword123"
    } | ConvertTo-Json)
```

**Expected Error:**
```json
{
  "error": "Email or Phone already exists"
}
```

---

### ❌ Scenario 5: Invalid OTP
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        userId = 1
        type = "email"
        otp = "9999"  # Wrong OTP
    } | ConvertTo-Json)
```

**Expected Error:**
```json
{
  "error": "Invalid OTP"
}
```

---

## View Logs After Testing

After running the tests, view the logs:

### Via API (Development Only)
```powershell
# View recent authentication logs
Invoke-RestMethod -Uri "http://localhost:5000/api/logs/auth?lines=50" | Write-Host

# View access logs
Invoke-RestMethod -Uri "http://localhost:5000/api/logs/access?lines=50" | Write-Host
```

### Via File System
```powershell
# View auth logs
Get-Content "logs\auth.log" -Tail 20

# View access logs
Get-Content "logs\access.log" -Tail 20

# Search for failed logins
Select-String "LOGIN_FAILED" "logs\auth.log"
```

---

## Using the Automated Test Script

Instead of running commands manually, use the automated PowerShell script:

```powershell
cd "C:\Users\Rohan Salal\OneDrive\Desktop\CA website\backend"
.\test-api.ps1
```

This script will:
1. ✅ Register a test user
2. ✅ Verify email with OTP
3. ✅ Login and get JWT token
4. ✅ Display results with color coding
5. ✅ Show JWT token for future use

---

## Quick Reference - API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/verify` | POST | Verify email/phone with OTP |
| `/api/auth/login` | POST | Login and get JWT token |
| `/health` | GET | Server health check |
| `/api/logs/:type` | GET | View logs (dev only) |

---

## JWT Token Usage

Once you have a token from login, use it for protected requests:

```powershell
$token = "YOUR_JWT_TOKEN_HERE"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Example: Access protected endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/services" `
    -Method GET `
    -Headers $headers
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure server is running: `npm run dev` |
| Invalid JSON | Check that email/password are in quotes |
| "Email not verified" error | Run verification step with OTP "1234" |
| 500 error | Check server logs in terminal |
| No logs files created | Server must be running to create logs |

---

## Test Data Examples

```
User 1:
  Name: John Doe
  Email: john@example.com
  Phone: 9876543210
  Password: SecurePassword123

User 2:
  Name: Alice Smith
  Email: alice@test.com
  Phone: 9988776655
  Password: MyPassword123

User 3:
  Name: Bob Johnson
  Email: bob@test.com
  Phone: 9988774433
  Password: BobPassword123

Test OTP (mocked):
  OTP: 1234
```

---

All test scenarios are documented above. Start testing! 🚀
