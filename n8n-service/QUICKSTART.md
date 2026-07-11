# n8n Quick Start Guide

Get n8n up and running in 5 minutes!

## Step 1: Start n8n

**Option A: Using PowerShell Script (Windows - Recommended)**
```powershell
cd n8n-service
.\setup.ps1
```

**Option B: Using Docker Compose**
```bash
docker-compose up -d n8n-db n8n
```

**Option C: Using npm (Standalone)**
```bash
npm install -g n8n
n8n start
```

## Step 2: Access n8n

Open your browser and go to:
```
http://localhost:5678
```

Login with:
- **Username:** `admin`
- **Password:** `admin123`

## Step 3: Create Your First Workflow

### Example: Order Confirmation Automation

1. Click **"+ Add workflow"** button
2. Click **"Add first step"**
3. Search for **"Webhook"** and select it
4. Configure webhook:
   - **Path:** `order-created`
   - **Method:** POST
   - Click **"Listen for test event"**

5. Add another node (click the **+** button)
6. Search for **"HTTP Request"** and select it
7. Configure:
   - **Method:** POST
   - **URL:** `http://localhost:4007/notifications/send`
   - **Body:**
   ```json
   {
     "userId": "{{ $json.userId }}",
     "type": "ORDER_CONFIRMED",
     "email": "{{ $json.email }}",
     "orderId": "{{ $json.orderId }}",
     "amount": "{{ $json.totalAmount }}"
   }
   ```

8. Click **"Save"** (top right)
9. Toggle the switch to **"Active"**

## Step 4: Test Your Workflow

Open a new terminal and test with curl:

```bash
curl -X POST http://localhost:5678/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-001",
    "userId": "user-123",
    "email": "customer@example.com",
    "totalAmount": 1999,
    "items": [{"productId": "p1", "quantity": 1}]
  }'
```

Check the **Executions** tab in n8n to see the workflow run!

## Step 5: Import Pre-built Workflows

1. Go to **Workflows** page
2. Click **"Import from File"**
3. Navigate to `n8n-service/workflows/`
4. Select a workflow JSON file
5. Click **"Import"**
6. Activate the workflow

Available templates:
- `order-confirmation-workflow.json` - Send order confirmations
- `low-stock-alert-workflow.json` - Monitor inventory levels

## Common Use Cases

### 1. Send Welcome Email on Signup

**Trigger:** Webhook from Auth Service  
**Action:** Send email via Notification Service

### 2. Low Stock Alerts

**Trigger:** Scheduled (every 6 hours)  
**Action:** Check inventory and alert admin

### 3. Order Status Updates

**Trigger:** Webhook from Order Service  
**Action:** Notify customer via email/SMS

### 4. Abandoned Cart Recovery

**Trigger:** Scheduled (daily)  
**Action:** Send reminder emails with discount codes

## Integration with Services

Add to your service code (e.g., Order Service):

```javascript
// After order creation
fetch('http://localhost:5678/webhook/order-created', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    userId: order.userId,
    email: user.email,
    totalAmount: order.totalAmount,
    items: order.items
  })
}).catch(err => console.error('Webhook failed:', err));
```

## Useful Commands

```bash
# Start n8n
docker-compose up -d n8n

# Stop n8n
docker-compose stop n8n

# View logs
docker-compose logs -f n8n

# Restart n8n
docker-compose restart n8n

# Remove n8n (keeps data)
docker-compose down n8n

# Remove everything (including data)
docker-compose down -v
```

## Next Steps

1. ✅ Read the full documentation: `WORKFLOW_GUIDE.md`
2. ✅ Explore workflow examples: `workflows/` folder
3. ✅ Change default password in `.env`
4. ✅ Set up more workflows for your needs
5. ✅ Integrate webhooks in your services

## Troubleshooting

**Can't access n8n UI?**
- Wait 30 seconds for service to start
- Check if running: `docker-compose ps n8n`
- Check logs: `docker-compose logs n8n`

**Webhook not working?**
- Ensure workflow is active (green toggle)
- Check webhook URL matches
- View execution logs in n8n

**Need help?**
- Read `README.md` for detailed setup
- Check `WORKFLOW_GUIDE.md` for tutorials
- Visit [n8n Community](https://community.n8n.io/)

---

**🎉 You're all set!** Start automating your e-commerce workflows with n8n.
