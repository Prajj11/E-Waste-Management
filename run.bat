@echo off
setlocal enabledelayedexpansion
title EcoCycle - E-Waste Management System Launcher

:: ============================================================================
:: Locate the ewaste-management-system Directory
:: ============================================================================
set "PROJECT_DIR=%~dp0"
if exist "%PROJECT_DIR%frontend" (
    goto :FoundProject
)
if exist "%PROJECT_DIR%E-Waste-Management-main\E-Waste-Management-main\EcoCycle_E-Waste_Project\ewaste-management-system\frontend" (
    set "PROJECT_DIR=%PROJECT_DIR%E-Waste-Management-main\E-Waste-Management-main\EcoCycle_E-Waste_Project\ewaste-management-system\"
    goto :FoundProject
)
for /d /r "%~dp0" %%d in (ewaste-management-system) do (
    if exist "%%d\frontend" (
        set "PROJECT_DIR=%%d\"
        goto :FoundProject
    )
)

echo.
echo ============================================================================
echo [ERROR] Could not locate the 'ewaste-management-system' directory!
echo Please make sure the project files have not been moved or deleted.
echo ============================================================================
echo.
pause
exit /b 1

:FoundProject
set "FRONTEND_DIR=%PROJECT_DIR%frontend"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "DATABASE_DIR=%PROJECT_DIR%database"

:: ============================================================================
:: Check Node.js and NPM Requirements
:: ============================================================================
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================================================
    echo [ERROR] Node.js is not found on your system PATH!
    echo Node.js is required to run the frontend and backend.
    echo Please install Node.js - LTS version recommended - from:
    echo   https://nodejs.org/
    echo ============================================================================
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo ============================================================================
    echo [ERROR] npm is not found on your system PATH!
    echo ============================================================================
    echo.
    pause
    exit /b 1
)

:: ============================================================================
:: Ensure .env files exist from templates
:: ============================================================================
if not exist "%FRONTEND_DIR%\.env" (
    if exist "%FRONTEND_DIR%\.env.example" (
        echo [INFO] Creating frontend/.env from .env.example...
        copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
    )
)
if not exist "%BACKEND_DIR%\.env" (
    if exist "%BACKEND_DIR%\.env.example" (
        echo [INFO] Creating backend/.env from .env.example...
        copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
    )
)

:MainMenu
cls
echo ================================================================================
echo                    EcoCycle - E-Waste Management System
echo ================================================================================
echo   Project Location: %PROJECT_DIR%
echo ================================================================================
echo.
echo   [1] Quick Start (Frontend with Mock Server) [DEFAULT - auto-starts in 8s]
echo       * Runs standalone in browser with localStorage mock database.
echo       * No Oracle database required.
echo       * Pre-loaded demo logins: Admin, Collector, User (buttons on login page).
echo       * URL: http://localhost:5173
echo.
echo   [2] Full Stack (Express Backend + Oracle Database + React Frontend)
echo       * Runs Express API (port 5000) and React UI (port 5173).
echo       * Connects to Oracle Database (requires OracleServiceXE running).
echo.
echo   [3] Start Oracle XE Services (Requires Administrator)
echo       * Attempts to start OracleServiceXE and TNSListener services.
echo.
echo   [4] Seed User Passwords in Oracle DB
echo       * Hashes placeholder passwords into real bcrypt hashes.
echo.
echo   [5] Stop Running Project Servers
echo       * Stops any processes running on ports 5173 (frontend) or 5000 (backend).
echo.
echo   [6] Install / Reinstall Dependencies
echo       * Runs npm install for both frontend and backend.
echo.
echo   [0] Exit
echo.
echo ================================================================================

choice /c 1234560 /t 8 /d 1 /m "Select an option [1-6, 0]"
set "USER_CHOICE=%ERRORLEVEL%"

if "%USER_CHOICE%"=="1" goto :StartMock
if "%USER_CHOICE%"=="2" goto :StartFullStack
if "%USER_CHOICE%"=="3" goto :StartOracleServices
if "%USER_CHOICE%"=="4" goto :SeedUsers
if "%USER_CHOICE%"=="5" goto :StopServers
if "%USER_CHOICE%"=="6" goto :InstallDeps
if "%USER_CHOICE%"=="7" goto :ExitScript

goto :MainMenu

:: ============================================================================
:: OPTION 1: Mock Mode (Frontend only)
:: ============================================================================
:StartMock
echo.
echo ================================================================================
echo  Starting EcoCycle in Mock Mode...
echo ================================================================================
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%" && call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        goto :MainMenu
    )
)

powershell -NoProfile -Command "(Get-Content '%FRONTEND_DIR%\.env') -replace '^VITE_USE_MOCK=.*', 'VITE_USE_MOCK=true' | Set-Content '%FRONTEND_DIR%\.env'"

echo [INFO] Launching Frontend dev server on http://localhost:5173 ...
start "EcoCycle - Frontend (Mock Mode)" cmd /k "cd /d "%FRONTEND_DIR%" && echo EcoCycle Frontend running in Mock Mode (Press Ctrl+C to stop) && echo. && npm run dev"

echo [INFO] Waiting for server to initialize...
ping -n 3 127.0.0.1 >nul

echo [INFO] Opening web browser...
start "" "http://localhost:5173"

echo.
echo ================================================================================
echo [SUCCESS] EcoCycle is running in Mock Mode.
echo.
echo Demo logins (also clickable as quick buttons on the login page):
echo   - Admin:     admin@ecocycle.in  / admin123
echo   - Collector: rahul@ecocycle.in  / collect123
echo   - User:      priya@example.com  / user123
echo ================================================================================
echo.
pause
goto :MainMenu

:: ============================================================================
:: OPTION 2: Full Stack Mode (Backend + Frontend + Oracle DB)
:: ============================================================================
:StartFullStack
echo.
echo ================================================================================
echo  Starting EcoCycle Full Stack (Backend + Frontend)...
echo ================================================================================

for /f "tokens=*" %%s in ('powershell -NoProfile -Command "(Get-Service -Name OracleServiceXE -ErrorAction SilentlyContinue).Status"') do set "ORA_STATUS=%%s"

if /i "%ORA_STATUS%"=="Stopped" (
    echo [WARNING] OracleServiceXE is currently STOPPED.
    echo The backend requires an active Oracle Database connection.
    echo.
    echo You can start Oracle via option [3] as Administrator, or continue if using
    echo a remote or alternative Oracle instance.
    echo.
    set /p "CONT=Do you want to proceed anyway? (Y/N, default Y): "
    if /i "!CONT!"=="N" goto :MainMenu
)

if not exist "%BACKEND_DIR%\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd /d "%BACKEND_DIR%" && call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        goto :MainMenu
    )
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd /d "%FRONTEND_DIR%" && call npm install
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        goto :MainMenu
    )
)

powershell -NoProfile -Command "(Get-Content '%FRONTEND_DIR%\.env') -replace '^VITE_USE_MOCK=.*', 'VITE_USE_MOCK=false' | Set-Content '%FRONTEND_DIR%\.env'"

echo [INFO] Starting Backend API on http://localhost:5000 ...
start "EcoCycle - Backend API (Port 5000)" cmd /k "cd /d "%BACKEND_DIR%" && echo Starting EcoCycle Backend on port 5000 (Press Ctrl+C to stop) && echo. && npm run dev"

echo [INFO] Starting Frontend UI on http://localhost:5173 ...
start "EcoCycle - Frontend UI (Port 5173)" cmd /k "cd /d "%FRONTEND_DIR%" && echo Starting EcoCycle Frontend on port 5173 (Press Ctrl+C to stop) && echo. && npm run dev"

echo [INFO] Waiting for servers to initialize...
ping -n 4 127.0.0.1 >nul

echo [INFO] Opening web browser...
start "" "http://localhost:5173"

echo.
echo ================================================================================
echo [SUCCESS] Full Stack services started.
echo Frontend:    http://localhost:5173
echo Backend API: http://localhost:5000/api/health
echo ================================================================================
echo.
pause
goto :MainMenu

:: ============================================================================
:: OPTION 3: Start Oracle XE Services
:: ============================================================================
:StartOracleServices
echo.
echo ================================================================================
echo  Starting Oracle XE Services...
echo ================================================================================
echo Attempting to start OracleServiceXE...
net start OracleServiceXE
echo.
echo Attempting to start OracleOraDB21Home1TNSListener...
net start OracleOraDB21Home1TNSListener
echo.
if %ERRORLEVEL% neq 0 (
    echo [NOTE] If you got 'Access is denied', right-click this .bat file
    echo        and choose 'Run as administrator'.
)
echo.
pause
goto :MainMenu

:: ============================================================================
:: OPTION 4: Seed Users
:: ============================================================================
:SeedUsers
echo.
echo ================================================================================
echo  Seeding Demo User Passwords into Oracle Database...
echo ================================================================================
cd /d "%BACKEND_DIR%"
call npm run seed:users
echo.
pause
goto :MainMenu

:: ============================================================================
:: OPTION 5: Stop Servers
:: ============================================================================
:StopServers
echo.
echo ================================================================================
echo  Stopping Project Servers on ports 5173 and 5000...
echo ================================================================================
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173,5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Write-Output '[OK] Stopped active processes on ports 5173 and 5000.'"
echo.
pause
goto :MainMenu

:: ============================================================================
:: OPTION 6: Install Dependencies
:: ============================================================================
:InstallDeps
echo.
echo ================================================================================
echo  Installing Frontend & Backend Dependencies...
echo ================================================================================
echo [1/2] Installing Frontend Dependencies...
cd /d "%FRONTEND_DIR%" && call npm install
echo.
echo [2/2] Installing Backend Dependencies...
cd /d "%BACKEND_DIR%" && call npm install
echo.
echo [DONE] All dependencies installed.
pause
goto :MainMenu

:ExitScript
echo Exiting...
exit /b 0
