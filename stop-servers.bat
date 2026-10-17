@echo off
title EcoCycle - Stop Running Servers
echo ================================================================================
echo  Stopping EcoCycle Servers (Ports 5173 and 5000)...
echo ================================================================================
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173,5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Write-Output '[OK] All active EcoCycle servers stopped.'"
echo.
ping -n 3 127.0.0.1 >nul
