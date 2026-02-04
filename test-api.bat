@echo off
REM API Testing Script for CA Website Backend
REM Tests: Register User -> Verify Email -> Login

echo ============================================
echo CA Website Backend - API Testing Script
echo ============================================
echo.

REM Configuration
set BASE_URL=http://localhost:5000/api
set EMAIL=testuser@example.com
set PHONE=9876543210
set PASSWORD=SecurePassword123
set NAME=Test User

echo [STEP 1] Testing User Registration
echo ====================================
echo Email: %EMAIL%
echo Phone: %PHONE%
echo Name: %NAME%
echo Password: %PASSWORD%
echo.

REM Register User
for /f "tokens=*" %%i in ('curl -s -X POST "%BASE_URL%/auth/register" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"%NAME%\",\"email\":\"%EMAIL%\",\"phone\":\"%PHONE%\",\"password\":\"%PASSWORD%\"}"') do set REGISTER_RESPONSE=%%i

echo Response: %REGISTER_RESPONSE%
echo.

REM Extract User ID (basic extraction for batch - you may need to use jq on PowerShell)
REM This is a simplified version. For better parsing, use PowerShell instead.

echo.
echo [STEP 2] Testing Email Verification (OTP: 1234)
echo =============================================
echo Note: OTP is mocked as '1234' for testing
echo.

REM For this, you'll need to manually extract userId from Step 1 response
echo Please extract the userId from the registration response above
echo Then replace USER_ID in the verification command
echo.

echo.
echo [STEP 3] Testing User Login
echo =============================
echo.

echo Switch to PowerShell for better JSON parsing:
echo Copy the commands below and run in PowerShell
pause

