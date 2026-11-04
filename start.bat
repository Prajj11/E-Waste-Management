@echo off
title EcoCycle - Starting All Servers...
cd /d "%~dp0"

echo.
echo ===============================================================================
echo                ECOCYCLE - E-WASTE MANAGEMENT SYSTEM
echo ===============================================================================
echo.

:: 1. Check MongoDB
echo [1/4] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul 2>nul
if %errorlevel% neq 0 (
    echo       MongoDB service not running. Attempting to start...
    net start MongoDB >nul 2>nul
    timeout /t 2 /nobreak >nul
    sc query MongoDB | find "RUNNING" >nul 2>nul
    if %errorlevel% neq 0 (
        echo       [ERROR] Could not start MongoDB. Please start it manually.
        pause
        exit /b 1
    )
)
echo       MongoDB is RUNNING on port 27017

:: 2. Set frontend to use real backend
echo [2/4] Starting Backend API server (port 5000)...
(
    echo VITE_USE_MOCK=false
    echo VITE_API_URL=/api
) > "frontend\.env"
start "EcoCycle - Backend" /D "%~dp0backend" cmd /k "npm run dev"

:: 3. Start frontend
echo [3/4] Starting Frontend dev server (port 5173)...
start "EcoCycle - Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

:: 4. Open browser
echo [4/4] Opening browser...
timeout /t 4 /nobreak >nul
start http://localhost:5173

cls
echo ===============================================================================
echo            ALL SERVERS RUNNING - EcoCycle is ready!
echo ===============================================================================
echo.
echo   MongoDB:  localhost:27017  (Windows service)
echo   Backend:  http://localhost:5000/api/health
echo   Frontend: http://localhost:5173
echo.
echo   Login Accounts:
echo   ---------------
echo   Admin:     admin@ecocycle.in  /  admin123
echo   Collector: rahul@ecocycle.in  /  collect123
echo   Citizen:   priya@example.com  /  user123
echo.
echo ===============================================================================
echo   Keep the server windows open. Press any key to close this launcher.
pause >nul

