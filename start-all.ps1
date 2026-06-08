$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$services = @(
  @{ Name = 'auth-service'; Path = 'services/auth-service'; Command = 'npm start' },
  @{ Name = 'user-service'; Path = 'services/user-service'; Command = 'npm start' },
  @{ Name = 'product-service'; Path = 'services/product-service'; Command = 'npm start' },
  @{ Name = 'category-service'; Path = 'services/category-service'; Command = 'npm start' },
  @{ Name = 'inventory-service'; Path = 'services/inventory-service'; Command = 'npm start' },
  @{ Name = 'order-service'; Path = 'services/order-service'; Command = 'npm start' },
  @{ Name = 'payment-service'; Path = 'services/payment-service'; Command = 'npm start' },
  @{ Name = 'employee-service'; Path = 'services/employee-service'; Command = 'npm start' },
  @{ Name = 'supplier-service'; Path = 'services/supplier-service'; Command = 'npm start' },
  @{ Name = 'promotion-service'; Path = 'services/promotion-service'; Command = 'npm start' },
  @{ Name = 'notification-service'; Path = 'services/notification-service'; Command = 'npm start' },
  @{ Name = 'analytics-service'; Path = 'services/analytics-service'; Command = 'npm start' },
  @{ Name = 'logging-service'; Path = 'services/logging-service'; Command = 'npm start' },
  @{ Name = 'api-gateway'; Path = 'api-gateway'; Command = 'npm start' },
  @{ Name = 'frontend'; Path = 'frontend'; Command = 'npm run dev' }
)

foreach ($svc in $services) {
  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    "Set-Location '$root\\$($svc.Path)'; $($svc.Command)"
  )
}
