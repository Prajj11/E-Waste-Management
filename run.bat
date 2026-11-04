@echo off
setlocal enabledelayedexpansion
title EcoCycle - E-Waste Management System Launcher
cd /d "%~dp0"

:: Detect project directory (handles running from root or parent folder)
if exist "frontend\package.json" (
    set "PROJECT_DIR=%CD%"
) else if exist "E-Waste-Management-main\frontend\package.json" (
    set "PROJECT_DIR=%CD%\E-Waste-Management-main"
    cd /d "!PROJECT_DIR!"
) else (
    echo.
    echo ================================================================
    echo  [ERROR] Project directory not found!
    echo ================================================================
    echo  Could not find frontend\package.json.
    echo  Please ensure this bat file is in the project folder.
    echo ================================================================
    echo.
    pause
    exit /b 1
)

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo  [ERROR] Node.js is not installed or not in your system PATH!
    echo ================================================================
    echo  Node.js is required to run EcoCycle.
    echo  Please download and install it from: https://nodejs.org/
    echo ================================================================
    echo.
    pause
    exit /b 1
)

:MENU
cls
echo ===============================================================================
echo                ECOCYCLE - E-WASTE MANAGEMENT SYSTEM
echo ===============================================================================
echo.
echo   Select your desired launch mode:
echo.
echo   [1] Standalone / Mock Mode (Recommended for quick testing)
echo       - Runs the frontend with in-browser mock API (localStorage)
echo       - ZERO setup required (no MongoDB database needed)
echo       - Pre-loaded with demo users, requests, and categories
echo.
echo   [2] Full-Stack Mode (Backend Express API + Frontend)
echo       - Runs both Node.js backend (port 5000) and Vite frontend (port 5173)
echo       - Connects to MongoDB (configured in backend\.env)
echo.
echo   [3] Install / Reinstall Dependencies (npm install for frontend + backend)
echo.
echo   [4] Exit
echo.
echo ===============================================================================
echo   Defaulting to [1] in 10 seconds if no key is pressed...
choice /c 1234 /t 10 /d 1 /m "Enter your choice [1-4]: "
set "USER_CHOICE=%errorlevel%"

if "%USER_CHOICE%"=="1" goto MOCK_MODE
if "%USER_CHOICE%"=="2" goto FULL_STACK_MODE
if "%USER_CHOICE%"=="3" goto INSTALL_DEPS
if "%USER_CHOICE%"=="4" goto EXIT_SCRIPT

goto MENU

:CHECK_FRONTEND_DEPS
if not exist "frontend\node_modules" (
    echo.
    echo [INFO] Frontend dependencies not found. Installing now (this may take a minute)...
    pushd frontend
    call npm install
    popd
)
exit /b 0

:CHECK_BACKEND_DEPS
if not exist "backend\node_modules" (
    echo.
    echo [INFO] Backend dependencies not found. Installing now (this may take a minute)...
    pushd backend
    call npm install
    popd
)
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [INFO] Creating backend\.env from template...
        copy "backend\.env.example" "backend\.env" >nul
    )
)
exit /b 0

:MOCK_MODE
cls
echo ===============================================================================
echo                 Starting EcoCycle in Standalone Mock Mode
echo ===============================================================================
call :CHECK_FRONTEND_DEPS

:: Configure frontend .env for mock mode
echo VITE_USE_MOCK=true> "frontend\.env"
echo VITE_API_URL=/api>> "frontend\.env"

echo.
echo [1/2] Starting frontend development server on port 5173...
start "EcoCycle - Frontend Server" cmd /k "cd /d "%PROJECT_DIR%\frontend" && npm run dev"

echo [2/2] Launching browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

cls
echo ===============================================================================
echo             EcoCycle is RUNNING at http://localhost:5173
echo ===============================================================================
echo.
echo   Demo Login Accounts (or click Quick Demo Login on the page):
echo   ------------------------------------------------------------
echo   * Admin:     admin@ecocycle.in  /  admin123
echo   * Collector: rahul@ecocycle.in  /  collect123
echo   * User:      priya@example.com  /  user123
echo.
echo   NOTE: In Mock Mode, all operations save locally in your browser.
echo   Keep the "EcoCycle - Frontend Server" window open while using the app.
echo.
echo ===============================================================================
echo   Press any key to close this launcher (server will remain running in its window).
pause >nul
exit /b 0

:FULL_STACK_MODE
cls
echo ===============================================================================
echo                 Starting EcoCycle in Full-Stack Mode
echo ===============================================================================
call :CHECK_BACKEND_DEPS
call :CHECK_FRONTEND_DEPS

:: Configure frontend .env to connect to backend
echo VITE_USE_MOCK=false> "frontend\.env"
echo VITE_API_URL=/api>> "frontend\.env"

echo.
echo [1/3] Starting backend REST API server on port 5000...
start "EcoCycle - Backend API Server" cmd /k "cd /d "%PROJECT_DIR%\backend" && npm run dev"

echo [2/3] Starting frontend development server on port 5173...
start "EcoCycle - Frontend Server" cmd /k "cd /d "%PROJECT_DIR%\frontend" && npm run dev"

echo [3/3] Launching browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

cls
echo ===============================================================================
echo         EcoCycle Full-Stack is RUNNING at http://localhost:5173
echo ===============================================================================
echo.
echo   - Backend API: http://localhost:5000/api/health
echo   - Frontend:    http://localhost:5173
echo.
echo   Database: MongoDB (configured in backend\.env)
echo   To seed initial demo data into MongoDB, run 'npm run seed' in backend folder.
echo.
echo   Keep the server windows open while using the application.
echo ===============================================================================
echo   Press any key to close this launcher (servers will remain running in their windows).
pause >nul
exit /b 0

:INSTALL_DEPS
cls
echo ===============================================================================
echo                     Installing Project Dependencies
echo ===============================================================================
echo.
echo [1/2] Installing frontend dependencies...
pushd frontend
call npm install
popd
echo.
echo [2/2] Installing backend dependencies...
pushd backend
call npm install
popd
echo.
echo ===============================================================================
echo   Dependencies installation completed!
echo ===============================================================================
pause
goto MENU

:EXIT_SCRIPT
exit /b 0
