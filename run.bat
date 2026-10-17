@echo off
title EcoCycle - E-Waste Management System
cd /d "%~dp0"

echo ======================================================================
echo           EcoCycle - E-Waste Management System
echo ======================================================================
echo.

:: 1. Verify Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found on your system PATH!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Ensure frontend .env file exists and uses Mock mode by default
if not exist "frontend\.env" (
    if exist "frontend\.env.example" copy "frontend\.env.example" "frontend\.env" >nul
)
powershell -NoProfile -Command "(Get-Content 'frontend\.env') -replace '^VITE_USE_MOCK=.*', 'VITE_USE_MOCK=true' | Set-Content 'frontend\.env'"

:: 3. Check and install frontend dependencies if missing
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies, please wait...
    cd frontend && call npm install && cd ..
)

:: 4. If Oracle XE service is running, start backend API alongside
set "ORACLE_RUNNING=0"
for /f "tokens=*" %%s in ('powershell -NoProfile -Command "(Get-Service -Name OracleServiceXE -ErrorAction SilentlyContinue).Status"') do (
    if /i "%%s"=="Running" set "ORACLE_RUNNING=1"
)

if "%ORACLE_RUNNING%"=="1" (
    echo [INFO] Oracle Database is active. Starting backend API...
    if not exist "backend\.env" (
        if exist "backend\.env.example" copy "backend\.env.example" "backend\.env" >nul
    )
    if not exist "backend\node_modules" (
        echo [INFO] Installing backend dependencies...
        cd backend && call npm install && cd ..
    )
    powershell -NoProfile -Command "(Get-Content 'frontend\.env') -replace '^VITE_USE_MOCK=.*', 'VITE_USE_MOCK=false' | Set-Content 'frontend\.env'"
    start "EcoCycle Backend [Port 5000]" cmd /k "cd /d "%~dp0backend" && npm run dev"
) else (
    echo [INFO] Running in Standalone Mock Mode [No database setup required]
)

:: 5. Open browser in background after 2 seconds
start /b "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5173'"

echo [INFO] Starting EcoCycle on http://localhost:5173 ...
echo.
echo Demo Accounts [also clickable on the login screen]:
echo   - Admin:     admin@ecocycle.in  / admin123
echo   - Collector: rahul@ecocycle.in  / collect123
echo   - User:      priya@example.com  / user123
echo.
echo Press Ctrl+C to stop the application at any time.
echo ======================================================================
echo.

:: 6. Run frontend dev server directly in this window
cd /d "%~dp0frontend"
call npm run dev
