@echo off
setlocal enabledelayedexpansion
title EcoCycle - Quick Start (Mock Mode)

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

if not exist "%FRONTEND_DIR%\.env" (
    if exist "%FRONTEND_DIR%\.env.example" copy "%FRONTEND_DIR%\.env.example" "%FRONTEND_DIR%\.env" >nul
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [INFO] Installing frontend packages...
    cd /d "%FRONTEND_DIR%" && call npm install
)

powershell -NoProfile -Command "(Get-Content '%FRONTEND_DIR%\.env') -replace '^VITE_USE_MOCK=.*', 'VITE_USE_MOCK=true' | Set-Content '%FRONTEND_DIR%\.env'"

echo Starting EcoCycle frontend in Mock Mode...
start "EcoCycle Frontend (Mock Mode)" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

ping -n 3 127.0.0.1 >nul
start "" "http://localhost:5173"

echo Started! Browser opening to http://localhost:5173
