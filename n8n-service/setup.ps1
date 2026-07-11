# n8n Workflow Automation Setup Script for Windows

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "n8n Workflow Automation Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker is installed" -ForegroundColor Green

# Check if docker-compose is installed
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose is not installed. Please install docker-compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ docker-compose is installed" -ForegroundColor Green

# Create .env file if it doesn't exist
if (!(Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Start n8n and its database
Write-Host ""
Write-Host "🚀 Starting n8n service..." -ForegroundColor Cyan
Set-Location ..
docker-compose up -d n8n-db n8n

Write-Host ""
Write-Host "⏳ Waiting for n8n to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if n8n is running
try {
    $response = Invoke-WebRequest -Uri http://localhost:5678 -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "✅ n8n is running successfully!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Access n8n at: http://localhost:5678" -ForegroundColor Cyan
    Write-Host "👤 Username: admin" -ForegroundColor White
    Write-Host "🔑 Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Open http://localhost:5678 in your browser"
    Write-Host "  2. Log in with the credentials above"
    Write-Host "  3. Import workflow templates from n8n-service/workflows/"
    Write-Host "  4. Configure webhook URLs in your services"
    Write-Host ""
    Write-Host "📖 Read n8n-service/README.md for more details" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "⚠️  n8n might still be starting up. Please wait a few more seconds." -ForegroundColor Yellow
    Write-Host "Check status with: docker-compose logs n8n" -ForegroundColor White
}
