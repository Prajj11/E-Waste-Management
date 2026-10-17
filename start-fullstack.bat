@echo off
setlocal enabledelayedexpansion
title EcoCycle - Full Stack (Backend + Frontend)

set "PROJECT_DIR=%~dp0"
if exist "%PROJECT_DIR%frontend" goto :Found
if exist "%PROJECT_DIR%E-Waste-Management-main\E-Waste-Management-main\EcoCycle_E-Waste_Project\ewaste-management-system\frontend" (
    set "PROJECT_DIR=%PROJECT_DIR%E-Waste-Management-main\E-Waste-Management-main\EcoCycle_E-Waste_Project\ewaste-management-system\"
    goto :Found
)
for /d /r "%~dp0" %%d in (ewaste-management-system) do (
    if exist "%%d\frontend" (
        set "PROJECT_DIR=%%d\"
        goto :Found
    )
)

:Found
set "FRONTEND_DIR=%PROJECT_DIR%frontend"
set "BACKEND_DIR=%PROJECT_DIR%backend"

if not exist "%FRONTEND_DIR%\.env" (
    if exist "%FRONTEND_DIR%\.env.example" copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
)
if not exist "%BACKEND_DIR%\.env" (
    if exist "%BACKEND_DIR%\.env.example" copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
)

if not exist "%BACKEND_DIR%\node_modules" (
    echo [INFO] Installing backend packages...
    cd /d "%BACKEND_DIR%" && call npm install
)
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Installing frontend packages...
    cd /d "%FRONTEND_DIR%" && call npm install
)

powershell -NoProfile -Command "(Get-Content '%FRONTEND_DIR%\.env') -replace '^VITE_USE_MOCK=.*', 'VITE_USE_MOCK=false' | Set-Content '%FRONTEND_DIR%\.env'"

echo Starting Backend on port 5000...
start "EcoCycle Backend (Port 5000)" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

echo Starting Frontend on port 5173...
start "EcoCycle Frontend (Port 5173)" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

ping -n 4 127.0.0.1 >nul
start "" "http://localhost:5173"

echo Services started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000/api/health
