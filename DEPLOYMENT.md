# Deployment Guide - ShopHub E-Commerce Platform

Complete guide for deploying the ShopHub e-commerce platform to production.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Service Deployment](#service-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

### Security
- [ ] Change all default passwords
- [ ] Update JWT secret keys
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up environment variables
- [ ] Enable CORS properly
- [ ] Review API rate limiting

### Database
- [ ] Create production databases
- [ ] Run migrations
- [ ] Seed initial data
- [ ] Set up backups
- [ ] Configure connection pooling

### Services
- [ ] Build all services
- [ ] Run tests
- [ ] Check for errors
- [ ] Configure logging
- [ ] Set up monitoring

---

## Deployment Options

### Option 1: Docker Deployment (Recommended)

**Best for:** Quick deployment, easy scaling

**Platforms:**
- AWS ECS / EKS
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Railway
- Render

### Option 2: Traditional VPS Deployment

**Best for:** Full control, cost-effective

**Platforms:**
- AWS EC2
- DigitalOcean Droplets
- Linode
- Vultr
- Hetzner

### Option 3: Serverless Deployment

**Best for:** Pay-per-use, auto-scaling

**Platforms:**
- Vercel (Frontend)
- AWS Lambda (Backend)
- Netlify (Frontend)
- Cloudflare Workers

---

## Environment Setup

### 1. Production Environment Variables

Create `.env.production` for each service:

**API Gateway:**
```env
PORT=4000
NODE_ENV=production

# Service URLs (internal)
AUTH_SERVICE_URL=http://auth-service:4001
CATALOG_SERVICE_URL=http://catalog-service:4002
INVENTORY_SERVICE_URL=http://inventory-service:4003
CART_SERVICE_URL=http://cart-service:4004
ORDER_SERVICE_URL=http://order-service:4005
PAYMENT_SERVICE_URL=http://payment-service:4006
NOTIFICATION_SERVICE_URL=http://notification-service:4007
```

**Auth Service:**
```env
PORT=4001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/auth_db
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_64_CHARS
JWT_EXPIRES_IN=7d
```

**All Other Services:**
- Update database URLs
- Update service URLs
- Add API keys
- Configure email/SMS providers

### 2. Security Configuration

**Generate Strong Secrets:**
```bash
# JWT Secret
openssl rand -base64 64

# Database Password
openssl rand -base64 32

# Encryption Key
openssl rand -hex 32
```

---

## Database Setup

### Option A: Managed Database (Recommended)

**Providers:**
- **AWS RDS** (PostgreSQL)
- **Google Cloud SQL**
- **DigitalOcean Managed Database**
- **Supabase**
- **Neon**
- **Railway PostgreSQL**

**Steps:**
1. Create PostgreSQL instances for each service
2. Note connection strings
3. Update `.env` files
4. Run migrations
5. Enable SSL connections

### Option B: Self-Hosted Database

**Install PostgreSQL:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Create Databases:**
```sql
-- Create databases
CREATE DATABASE auth_db;
CREATE DATABASE catalog_db;
CREATE DATABASE inventory_db;
CREATE DATABASE cart_db;
CREATE DATABASE order_db;
CREATE DATABASE payment_db;
CREATE DATABASE notification_db;

-- Create user
CREATE USER ecommerce_user WITH PASSWORD 'strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO ecommerce_user;
-- Repeat for all databases
```

**Run Migrations:**
```bash
# For each service with Prisma
cd auth-service
npx prisma migrate deploy

cd ../catalog-service
npx prisma migrate deploy
# ... repeat for all services
```

---

## Service Deployment

### Method 1: Docker Compose (Single Server)

**1. Update docker-compose.prod.yml:**

```yaml
version: '3.8'

services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./api-gateway/.env.production
    restart: unless-stopped

  auth-service:
    build: ./auth-service
    environment:
      - NODE_ENV=production
    env_file:
      - ./auth-service/.env.production
    restart: unless-stopped
  
  # Add all other services...
```

**2. Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Method 2: Individual VPS Deployment

**1. Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**2. Install PM2 (Process Manager):**
```bash
sudo npm install -g pm2
```

**3. Deploy Each Service:**
```bash
# Clone repository
git clone https://github.com/Atharva6153-git/E-Commerce.git
cd E-Commerce

# Install dependencies for each service
cd api-gateway
npm install --production
cd ..

# Start with PM2
pm2 start api-gateway/server.js --name api-gateway
pm2 start auth-service/server.js --name auth-service
pm2 start catalog-service/src/server.js --name catalog-service
pm2 start inventory-service/src/server.js --name inventory-service
pm2 start cart-service/src/server.js --name cart-service
pm2 start order-service/src/server.js --name order-service
pm2 start payment-service/src/server.js --name payment-service
pm2 start notification-service/src/server.js --name notification-service

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
```

### Method 3: Cloud Platform Deployment

#### Deploy to Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

#### Deploy to Render

1. Create `render.yaml`:
   ```yaml
   services:
     - type: web
       name: api-gateway
       env: node
       buildCommand: cd api-gateway && npm install
       startCommand: cd api-gateway && npm start
   ```

2. Connect GitHub repository
3. Deploy automatically on push

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

**1. Install Vercel CLI:**
```bash
npm install -g vercel
```

**2. Deploy:**
```bash
cd frontend
vercel --prod
```

**3. Environment Variables:**
Add in Vercel dashboard:
```
VITE_API_URL=https://your-api-gateway.com
```

### Option 2: Netlify

**1. Build:**
```bash
cd frontend
npm run build
```

**2. Deploy:**
```bash
netlify deploy --prod --dir=dist
```

### Option 3: Self-Host with Nginx

**1. Build:**
```bash
cd frontend
npm run build
```

**2. Copy to server:**
```bash
scp -r dist/* user@server:/var/www/shophub
```

**3. Nginx Config:**
```nginx
server {
    listen 80;
    server_name shophub.com;

    root /var/www/shophub;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Post-Deployment

### 1. SSL/TLS Setup

**Using Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d shophub.com -d www.shophub.com
```

### 2. Monitoring Setup

**Install monitoring tools:**
```bash
# PM2 Monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# System monitoring
sudo apt install htop netdata
```

### 3. Backup Configuration

**Database Backups:**
```bash
# Daily backup script
#!/bin/bash
pg_dump -U user database > backup_$(date +%Y%m%d).sql
```

**Add to crontab:**
```bash
0 2 * * * /path/to/backup_script.sh
```

### 4. Health Checks

Test all endpoints:
```bash
# API Gateway
curl https://your-domain.com/api/health

# Services
curl http://your-domain.com/api/auth/health
curl http://your-domain.com/api/catalog/health
# ... test all services
```

### 5. Performance Optimization

- [ ] Enable caching (Redis)
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set up load balancing
- [ ] Configure rate limiting

---

## Maintenance

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Or with PM2
pm2 restart all
```

### Monitor Logs

```bash
# Docker
docker-compose logs -f

# PM2
pm2 logs

# System logs
tail -f /var/log/nginx/error.log
```

### Database Maintenance

```bash
# Vacuum database
psql -U user -d database -c "VACUUM ANALYZE;"

# Check database size
psql -U user -c "\l+"
```

---

## Troubleshooting

### Service Not Starting
- Check environment variables
- Verify database connection
- Check port availability
- Review service logs

### Database Connection Issues
- Verify connection string
- Check firewall rules
- Ensure database is running
- Test with psql client

### High Memory Usage
- Check for memory leaks
- Optimize database queries
- Increase server resources
- Enable connection pooling

---

## Support & Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## Quick Deploy Commands

**Full deployment from scratch:**
```bash
# 1. Clone repository
git clone https://github.com/Atharva6153-git/E-Commerce.git
cd E-Commerce

# 2. Setup databases
docker-compose up -d *-db

# 3. Run migrations
./scripts/run-migrations.sh

# 4. Build and start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Build and deploy frontend
cd frontend && npm run build && vercel --prod
```

**That's it! Your e-commerce platform is now live! 🚀**
