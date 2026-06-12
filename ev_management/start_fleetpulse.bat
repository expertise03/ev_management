@echo off
title FleetPulse — Startup

echo.
echo  =============================================
echo   FleetPulse EV Fleet Management Platform
echo  =============================================
echo.
echo  Starting ML API (Python) on port 5050...
start "FleetPulse ML API" cmd /k "cd /d %~dp0ml_api && python app.py"

echo  Waiting for ML API to initialize...
timeout /t 5 /nobreak >nul

echo  Starting Web Server on port 5500...
start "FleetPulse Web Server" cmd /k "cd /d %~dp0ev-fleet-app && python -m http.server 5500"

echo  Waiting for web server to start...
timeout /t 2 /nobreak >nul

echo.
echo  Opening dashboard in browser...
start http://localhost:5500/index.html

echo.
echo  Both servers are running.
echo  - Dashboard : http://localhost:5500
echo  - ML API    : http://localhost:5050/status
echo.
echo  Close this window to keep servers running.
echo  Close the individual server windows to stop them.
echo.
pause
