@echo off
setlocal enabledelayedexpansion
cd /d %~dp0

echo Starting backend services in one window...

start "" /b cmd /c "cd /d %~dp0services\auth-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\user-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\product-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\category-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\inventory-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\order-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\payment-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\employee-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\supplier-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\promotion-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\notification-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\analytics-service && npm start"
start "" /b cmd /c "cd /d %~dp0services\logging-service && npm start"
start "" /b cmd /c "cd /d %~dp0api-gateway && npm start"
start "" /b cmd /c "cd /d %~dp0frontend && npm run dev"

echo All services launched.
echo Leave this window open to keep processes running.
pause >nul
