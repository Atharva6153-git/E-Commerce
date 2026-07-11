# n8n Workflow Setup Guide

This guide will help you set up and configure automated workflows for your e-commerce platform.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Essential Workflows](#essential-workflows)
3. [Integration Steps](#integration-steps)
4. [Testing Workflows](#testing-workflows)
5. [Troubleshooting](#troubleshooting)

## Getting Started

### 1. Start n8n Service

**Using Docker Compose:**
```bash
docker-compose up -d n8n-db n8n
```

**Or run the setup script:**

Windows:
```powershell
cd n8n-service
.\setup.ps1
```

Linux/Mac:
```bash
cd n8n-service
chmod +x setup.sh
./setup.sh
```

### 2. Access n8n Dashboard

Open your browser and navigate to:
```
http://localhost:5678
```

Login credentials:
- **Username:** admin
- **Password:** admin123

### 3. Change Default Password

⚠️ **Important:** Change the default password immediately!

1. Go to Settings → Users
2. Click on your user
3. Change password
4. Update `.env` file with new password

## Essential Workflows

### 1. Order Confirmation Email

**Purpose:** Automatically send confirmation email when order is placed

**Setup Steps:**

1. In n8n, create new workflow
2. Add **Webhook** node:
   - **Webhook URL:** `/webhook/order-created`
   - **Method:** POST
   - **Response Mode:** Immediately
   
3. Add **HTTP Request** node:
   - **URL:** `http://localhost:4007/notifications/send`
   - **Method:** POST
   - **Body:**
   ```json
   {
     "userId": "{{ $json.userId }}",
     "type": "ORDER_CONFIRMED",
     "email": "{{ $json.email }}",
     "orderId": "{{ $json.orderId }}",
     "amount": "{{ $json.totalAmount }}",
     "itemCount": "{{ $json.items.length }}"
   }
   ```

4. Save and activate workflow

5. **Integrate with Order Service:**

   Add to `order-service/src/controllers/order.controller.js`:
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
   }).catch(err => console.error('n8n webhook failed:', err));
   ```

### 2. Low Stock Alert

**Purpose:** Alert admin when product stock is low

**Setup Steps:**

1. Create new workflow
2. Add **Cron** node:
   - **Trigger:** Every 6 hours
   
3. Add **HTTP Request** node to check inventory:
   - **URL:** `http://localhost:4003/stock/all`
   - **Method:** GET
   
4. Add **Function** node to filter low stock:
   ```javascript
   const lowStockItems = items[0].json.filter(item => 
     item.totalStock < 10
   );
   
   return lowStockItems.map(item => ({ json: item }));
   ```

5. Add **IF** node:
   - **Condition:** `{{ $json.totalStock }} < 10`

6. Add **HTTP Request** node to send alert:
   - **URL:** `http://localhost:4007/notifications/send`
   - **Method:** POST

7. Save and activate workflow

### 3. Order Status Update

**Purpose:** Notify customer when order status changes

**Setup Steps:**

1. Create new workflow
2. Add **Webhook** node:
   - **Webhook URL:** `/webhook/order-status-update`
   
3. Add **Switch** node to handle different statuses:
   - **Modes:** CONFIRMED, SHIPPED, DELIVERED, CANCELLED
   
4. Add **HTTP Request** nodes for each status

5. Save and activate workflow

### 4. Welcome Email on Signup

**Purpose:** Send welcome email to new users

**Setup Steps:**

1. Create new workflow
2. Add **Webhook** node:
   - **Webhook URL:** `/webhook/user-signup`
   
3. Add **HTTP Request** node:
   - **URL:** `http://localhost:4007/notifications/send`
   - **Body:**
   ```json
   {
     "userId": "{{ $json.userId }}",
     "type": "WELCOME_EMAIL",
     "email": "{{ $json.email }}",
     "name": "{{ $json.name }}"
   }
   ```

4. **Integrate with Auth Service:**

   Add to `auth-service/controllers/authController.js`:
   ```javascript
   // After user signup
   fetch('http://localhost:5678/webhook/user-signup', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userId: user.id,
       name: user.name,
       email: user.email
     })
   }).catch(err => console.error('n8n webhook failed:', err));
   ```

### 5. Abandoned Cart Recovery

**Purpose:** Send reminder email for abandoned carts

**Setup Steps:**

1. Create new workflow
2. Add **Cron** node:
   - **Trigger:** Daily at 10 AM
   
3. Add **HTTP Request** node:
   - **URL:** `http://localhost:4004/cart/abandoned`
   - **Method:** GET
   
4. Add **Loop Over Items** node

5. Add **HTTP Request** node to send reminder:
   - **URL:** `http://localhost:4007/notifications/send`
   - **Body:**
   ```json
   {
     "userId": "{{ $json.userId }}",
     "type": "CART_REMINDER",
     "email": "{{ $json.email }}",
     "cartValue": "{{ $json.total }}"
   }
   ```

## Integration Steps

### Using Integration Helper (Recommended)

1. Copy `integration-helper.js` to your service:
   ```bash
   cp n8n-service/integration-helper.js order-service/src/utils/
   ```

2. Import and use in your code:
   ```javascript
   const { notifyOrderCreated } = require('./utils/integration-helper');
   
   // In your order controller
   await notifyOrderCreated({
     id: order.id,
     userId: order.userId,
     totalAmount: order.totalAmount,
     items: order.items,
     email: user.email
   });
   ```

### Manual Webhook Integration

```javascript
async function callN8nWebhook(path, data) {
  try {
    await fetch(`http://localhost:5678/webhook/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('n8n webhook failed:', error);
  }
}
```

## Testing Workflows

### Test with curl

```bash
# Test order created webhook
curl -X POST http://localhost:5678/webhook/order-created \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-123",
    "userId": "user-456",
    "email": "test@example.com",
    "totalAmount": 1999,
    "items": [{"productId": "p1", "quantity": 1}]
  }'
```

### Test with Postman

1. Import the workflows from `workflows/` folder
2. Create a new request
3. Set method to POST
4. URL: `http://localhost:5678/webhook/order-created`
5. Body: Select raw JSON
6. Send test data

### Check Workflow Execution

1. Go to n8n dashboard
2. Click on "Executions" tab
3. View execution history and logs
4. Debug any failed executions

## Troubleshooting

### Webhook not triggering

**Check:**
1. Is n8n running? `docker-compose ps n8n`
2. Is webhook URL correct?
3. Check n8n logs: `docker-compose logs n8n`
4. Verify workflow is activated (toggle switch is ON)

### Database connection error

**Solution:**
1. Ensure n8n-db is running: `docker-compose ps n8n-db`
2. Check database credentials in `.env`
3. Restart n8n: `docker-compose restart n8n`

### Workflow execution fails

**Debug:**
1. Click on failed execution in n8n dashboard
2. View error messages
3. Check each node's input/output
4. Test HTTP endpoints manually
5. Verify service URLs are accessible

### Authentication errors

**Fix:**
1. Clear browser cache and cookies
2. Check credentials in `.env`
3. Restart n8n service
4. Reset password if needed

## Best Practices

1. **Always test workflows** before activating in production
2. **Use error handling nodes** to catch failures
3. **Add logging** for debugging
4. **Set timeouts** for HTTP requests
5. **Use environment variables** for URLs and credentials
6. **Document your workflows** with descriptions
7. **Version control** workflow exports
8. **Monitor execution history** regularly
9. **Set up alerts** for failed workflows
10. **Keep workflows simple** and modular

## Advanced Topics

### Custom Nodes

Create custom nodes for specific business logic:
1. Install n8n CLI: `npm install -g n8n`
2. Create node: `n8n-node-dev new`
3. Develop your logic
4. Build and install

### Webhook Security

Add API key authentication:
```javascript
// In your service
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.N8N_API_KEY
};
```

### Workflow Templates

Export and share workflows:
1. Open workflow in n8n
2. Click on "..." menu
3. Select "Download"
4. Share JSON file with team

## Support

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community](https://community.n8n.io/)
- [YouTube Tutorials](https://www.youtube.com/c/n8n-io)

## Next Steps

1. Set up monitoring and alerts
2. Create more complex workflows
3. Integrate with external services (Slack, SMS, etc.)
4. Build custom nodes for specific needs
5. Schedule reports and analytics
