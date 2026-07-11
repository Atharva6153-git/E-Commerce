#!/bin/bash

echo "========================================="
echo "n8n Workflow Automation Setup"
echo "========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✓ Docker is installed"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

echo "✓ docker-compose is installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

# Start n8n and its database
echo ""
echo "🚀 Starting n8n service..."
cd ..
docker-compose up -d n8n-db n8n

echo ""
echo "⏳ Waiting for n8n to be ready..."
sleep 10

# Check if n8n is running
if curl -s http://localhost:5678 > /dev/null; then
    echo ""
    echo "========================================="
    echo "✅ n8n is running successfully!"
    echo "========================================="
    echo ""
    echo "📍 Access n8n at: http://localhost:5678"
    echo "👤 Username: admin"
    echo "🔑 Password: admin123"
    echo ""
    echo "📚 Next steps:"
    echo "  1. Open http://localhost:5678 in your browser"
    echo "  2. Log in with the credentials above"
    echo "  3. Import workflow templates from n8n-service/workflows/"
    echo "  4. Configure webhook URLs in your services"
    echo ""
    echo "📖 Read n8n-service/README.md for more details"
    echo "========================================="
else
    echo ""
    echo "⚠️  n8n might still be starting up. Please wait a few more seconds."
    echo "Check status with: docker-compose logs n8n"
fi
