@echo off
echo Stopping existing backend processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting backend server...
cd Backend
start "Backend Server" cmd /k "npm start"

echo Backend restart initiated!