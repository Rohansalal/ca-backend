# CA Website Backend - API Testing Script
# Complete workflow: Register -> Verify -> Login

$BASE_URL = "http://localhost:5000/api"
$HEADERS = @{"Content-Type" = "application/json"}

# Test User Details
$EMAIL = "testuser@example.com"
$PHONE = "9876543210"
$PASSWORD = "SecurePassword123"
$NAME = "Test User"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CA Website Backend - API Testing" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# STEP 1: Register New User
# ============================================
Write-Host "[STEP 1] Register New User" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "Sending POST request to: $BASE_URL/auth/register" -ForegroundColor Gray
Write-Host ""

$registerBody = @{
    name     = $NAME
    email    = $EMAIL
    phone    = $PHONE
    password = $PASSWORD
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $registerBody -ForegroundColor White
Write-Host ""

try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/register" `
        -Method POST `
        -Headers $HEADERS `
        -Body $registerBody

    Write-Host "✓ Registration Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $registerResponse | ConvertTo-Json | Write-Host -ForegroundColor White

    $userID = $registerResponse.userId
    Write-Host ""
    Write-Host "User ID: $userID" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host "✗ Registration Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ============================================
# STEP 2: Verify Email with OTP
# ============================================
Write-Host "[STEP 2] Verify Email with OTP" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "Note: OTP is mocked as '1234' for testing" -ForegroundColor Gray
Write-Host ""

$verifyBody = @{
    userId = $userID
    type   = "email"
    otp    = "1234"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $verifyBody -ForegroundColor White
Write-Host ""

try {
    $verifyResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/verify" `
        -Method POST `
        -Headers $HEADERS `
        -Body $verifyBody

    Write-Host "✓ Email Verification Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $verifyResponse | ConvertTo-Json | Write-Host -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "✗ Email Verification Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ============================================
# STEP 3: Login with Email & Password
# ============================================
Write-Host "[STEP 3] Login with Email and Password" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host "Logging in with: $EMAIL" -ForegroundColor Gray
Write-Host ""

$loginBody = @{
    email    = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Gray
Write-Host $loginBody -ForegroundColor White
Write-Host ""

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method POST `
        -Headers $HEADERS `
        -Body $loginBody

    Write-Host "✓ Login Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $loginResponse | ConvertTo-Json | Write-Host -ForegroundColor White
    
    $token = $loginResponse.token
    Write-Host ""
    Write-Host "JWT Token (use for protected requests):" -ForegroundColor Cyan
    Write-Host $token -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "✗ Login Failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ============================================
# STEP 4: Test with JWT Token (Health Check)
# ============================================
Write-Host "[STEP 4] Test Protected Request (using JWT Token)" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

$protectedHeaders = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
}

Write-Host "Testing GET /health endpoint with JWT token..." -ForegroundColor Gray
Write-Host ""

try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" `
        -Method GET `
        -Headers $protectedHeaders

    Write-Host "✓ Protected Request Successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $healthResponse | ConvertTo-Json | Write-Host -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "⚠ Protected Request Note:" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
}

# ============================================
# STEP 5: View Logs
# ============================================
Write-Host "[STEP 5] View Authentication Logs" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "Fetching recent auth logs..." -ForegroundColor Gray
Write-Host ""

try {
    $logsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/logs/auth?lines=20" `
        -Method GET

    Write-Host "✓ Recent Auth Logs:" -ForegroundColor Green
    Write-Host $logsResponse -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "Note: Could not fetch logs via API (development mode required)" -ForegroundColor Gray
    Write-Host "Manually view logs at: backend/logs/auth.log" -ForegroundColor Gray
    Write-Host ""
}

# ============================================
# Summary
# ============================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✓ User Registered: $EMAIL" -ForegroundColor Green
Write-Host "  ✓ Email Verified (OTP: 1234)" -ForegroundColor Green
Write-Host "  ✓ User Logged In Successfully" -ForegroundColor Green
Write-Host "  ✓ JWT Token Generated" -ForegroundColor Green
Write-Host ""
Write-Host "JWT Token for future requests:" -ForegroundColor Cyan
Write-Host $token -ForegroundColor White
Write-Host ""
Write-Host "Log Files Location:" -ForegroundColor Cyan
Write-Host "  - Auth logs: backend/logs/auth.log" -ForegroundColor Gray
Write-Host "  - Access logs: backend/logs/access.log" -ForegroundColor Gray
Write-Host "  - All logs: backend/logs/combined.log" -ForegroundColor Gray
Write-Host ""
