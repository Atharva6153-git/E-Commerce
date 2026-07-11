# ShopHub E-Commerce - Service Startup Script

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Starting ShopHub E-Commerce Services" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Start databases
Write-Host "Starting databases..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✓ Databases started" -ForegroundColor Green
Write-Host ""

# Wait for databases to be ready
Write-Host "Waiting for databases to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "✓ Databases ready" -ForegroundColor Green
Write-Host ""

# List of services
$services = @(
    @{Name="API Gateway"; Path="api-gateway"; Port=4000},
    @{Name="Auth Service"; Path="auth-service"; Port=4001},
    @{Name="Catalog Service"; Path="catalog-service"; Port=4002},
    @{Name="Inventory Service"; Path="inventory-service"; Port=4003},
    @{Name="Cart Service"; Path="cart-service"; Port=4004},
    @{Name="Order Service"; Path="order-service"; Port=4005},
    @{Name="Payment Service"; Path="payment-service"; Port=4006},
    @{Name="Notification Service"; Path="notification-service"; Port=4007}
)

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
foreach ($service in $services) {
    Write-Host "$($service.Name): http://localhost:$($service.Port)" -ForegroundColor White
}
Write-Host ""

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "To start each service, open separate terminals and run:" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

foreach ($service in $services) {
    Write-Host "# Terminal for $($service.Name)" -ForegroundColor Yellow
    Write-Host "cd $($service.Path)" -ForegroundColor White
    Write-Host "npm run dev" -ForegroundColor White
    Write-Host ""
}

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Frontend:" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "cd frontend" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "Access frontend at: http://localhost:5173" -ForegroundColor Green
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
