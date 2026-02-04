# Simple Test Commands - Copy & Paste Ready

# Prerequisites: Server must be running
# Terminal: PowerShell (Windows)

# ========================================
# TEST 1: REGISTER A NEW USER
# ========================================

$reg = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        name = "Test User"
        email = "test@example.com"
        phone = "9876543210"
        password = "TestPassword123"
    } | ConvertTo-Json)

Write-Host "Registration Response:" -ForegroundColor Green
$reg | ConvertTo-Json | Write-Host

$userId = $reg.userId
Write-Host ""
Write-Host "User ID to use next: $userId" -ForegroundColor Cyan
Write-Host ""

# ========================================
# TEST 2: VERIFY EMAIL WITH OTP
# ========================================

$verify = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        userId = $userId
        type = "email"
        otp = "1234"
    } | ConvertTo-Json)

Write-Host "Verification Response:" -ForegroundColor Green
$verify | ConvertTo-Json | Write-Host
Write-Host ""

# ========================================
# TEST 3: LOGIN WITH EMAIL & PASSWORD
# ========================================

$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "test@example.com"
        password = "TestPassword123"
    } | ConvertTo-Json)

Write-Host "Login Response:" -ForegroundColor Green
$login | ConvertTo-Json | Write-Host
Write-Host ""

Write-Host "JWT Token (save this for protected requests):" -ForegroundColor Cyan
Write-Host $login.token -ForegroundColor Yellow
Write-Host ""

# ========================================
# TEST 4: VIEW AUTH LOGS
# ========================================

Write-Host "Recent Auth Logs:" -ForegroundColor Green
$logs = Invoke-RestMethod -Uri "http://localhost:5000/api/logs/auth?lines=10"
Write-Host $logs
Write-Host ""

# ========================================
# TEST COMPLETE
# ========================================

Write-Host "✓ All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check backend/logs/auth.log for detailed login info" -ForegroundColor Gray
Write-Host "2. Check backend/logs/access.log for HTTP requests" -ForegroundColor Gray
Write-Host "3. Use the JWT token for protected API requests" -ForegroundColor Gray
