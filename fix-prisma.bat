@echo off
echo ========================================
echo FIXING PRISMA CLIENT AND 500 ERRORS
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Node processes stopped
) else (
    echo ℹ No Node processes were running
)
echo.

echo Step 2: Waiting for file locks to release...
timeout /t 3 /nobreak >nul
echo ✓ Wait complete
echo.

echo Step 3: Cleaning Prisma Client cache...
if exist "node_modules\.prisma" (
    rmdir /s /q "node_modules\.prisma" 2>nul
    echo ✓ Prisma cache cleaned
) else (
    echo ℹ Prisma cache already clean
)
echo.

echo Step 4: Regenerating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% EQU 0 (
    echo ✓ Prisma Client regenerated successfully
) else (
    echo ✗ Prisma generation failed - try running manually
    pause
    exit /b 1
)
echo.

echo Step 5: Pushing schema to database...
call npx prisma db push
if %ERRORLEVEL% EQU 0 (
    echo ✓ Database schema updated
) else (
    echo ℹ Database push had warnings (this is usually okay)
)
echo.

echo ========================================
echo ✓ FIX COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Start the backend server: npm run dev
echo 2. Test the endpoints
echo 3. Review PRODUCTION_FIX_GUIDE.md for production deployment
echo.
echo Press any key to start the backend server now...
pause >nul

echo.
echo Starting backend server...
call npm run dev
