# ================================================
# COFFEE SHOP - Dev Mode (Hot Reload)
# Sửa code → save → tự động cập nhật
# ================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COFFEE SHOP - DEVELOPMENT MODE" -ForegroundColor Yellow
Write-Host "  Hot Reload: save file → auto refresh" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Dừng production nếu đang chạy
Write-Host "[1/3] Stopping production containers..." -ForegroundColor Gray
docker compose -f docker-compose.yml down 2>$null

# Build & start dev mode
Write-Host "[2/3] Building development containers..." -ForegroundColor Gray
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

Write-Host "[3/3] Waiting for services..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Check status
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVICES STATUS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps --format "table {{.Name}}\t{{.Status}}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend (HMR) : http://localhost:5173" -ForegroundColor Yellow
Write-Host "  API Gateway    : http://localhost:3000" -ForegroundColor Yellow
Write-Host "  RabbitMQ Admin : http://localhost:15672" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Sửa code → Save → Tự động reload!" -ForegroundColor Green
Write-Host "  Backend:  node --watch (auto restart)" -ForegroundColor Gray
Write-Host "  Frontend: React HMR (hot module replacement)" -ForegroundColor Gray
Write-Host ""
