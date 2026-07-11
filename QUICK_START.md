# Quick Start Guide - ShopHub E-Commerce

## Prerequisites
- Node.js v20 installed
- Docker Desktop running
- All dependencies installed (`npm install` in each service folder)

## Start the Application

### Step 1: Start Databases
```powershell
docker-compose up -d
```

### Step 2: Start Backend Services (Open 8 separate terminals)

**Terminal 1 - API Gateway:**
```powershell
cd api-gateway
npm run dev
```

**Terminal 2 - Auth Service:**
```powershell
cd auth-service
npm run dev
```

**Terminal 3 - Catalog Service:**
```powershell
cd catalog-service
npm run dev
```

**Terminal 4 - Inventory Service:**
```powershell
cd inventory-service
npm run dev
```

**Terminal 5 - Cart Service:**
```powershell
cd cart-service
npm run dev
```

**Terminal 6 - Order Service:**
```powershell
cd order-service
npm run dev
```

**Terminal 7 - Payment Service:**
```powershell
cd payment-service
npm run dev
```

**Terminal 8 - Notification Service:**
```powershell
cd notification-service
npm run dev
```

### Step 3: Start Frontend

**Terminal 9 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Step 4: Access Application

Open your browser and go to: **http://localhost:5173**

---

## Service Status Check

All services should show:
- ✅ API Gateway: Port 4000 - Running
- ✅ Auth Service: Port 4001 - Running
- ✅ Catalog Service: Port 4002 - Running
- ✅ Inventory Service: Port 4003 - Running
- ✅ Cart Service: Port 4004 - Running
- ✅ Order Service: Port 4005 - Running
- ✅ Payment Service: Port 4006 - Running
- ✅ Notification Service: Port 4007 - Running
- ✅ Frontend: Port 5173 - Running

---

## Troubleshooting

### Service not starting?
1. Check if port is already in use
2. Verify `.env` file exists
3. Check database connection
4. Look at error messages in terminal

### Database connection error?
```powershell
# Restart databases
docker-compose restart
```

### Port already in use?
```powershell
# Find process using port (example: 4000)
netstat -ano | findstr :4000

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

### Clear all and restart?
```powershell
# Stop all
docker-compose down

# Start fresh
docker-compose up -d
```

---

## Stop Everything

### Stop Services
Press `Ctrl+C` in each terminal

### Stop Databases
```powershell
docker-compose stop
```

### Remove Everything
```powershell
docker-compose down -v
```

---

## Test the Application

1. **Create Account:** Click "Sign up"
2. **Browse Products:** View products on homepage
3. **Add to Cart:** Click shopping cart icon
4. **Checkout:** Go to cart → Proceed to Checkout
5. **Payment:** Use Razorpay test cards

### Razorpay Test Cards:
- **Card Number:** 4111 1111 1111 1111
- **Expiry:** Any future date
- **CVV:** Any 3 digits
- **OTP:** 123456 (for test mode)

---

## Quick Reference

**Database URLs:**
- Auth DB: localhost:5433
- Catalog DB: localhost:5434
- Inventory DB: localhost:5435
- Cart DB: localhost:5436
- Order DB: localhost:5437
- Payment DB: localhost:5438
- Notification DB: localhost:5439

**API Gateway:** All requests go through http://localhost:4000/api/

**Frontend:** http://localhost:5173

---

## Need Help?

Check the following files:
- `DEPLOYMENT.md` - Full deployment guide
- `PROJECT_STATUS.md` - Project overview
- Each service has a `.env` file for configuration

---

**Everything is ready! Start your services and begin shopping! 🚀**
