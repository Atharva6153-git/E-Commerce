# n8n Workflow Automation Service

This service provides workflow automation capabilities for the e-commerce platform using n8n.

## Features

- **Order Processing Workflows**: Automate order confirmation, tracking updates
- **Inventory Management**: Alert when stock is low, auto-reorder
- **Customer Notifications**: Send emails/SMS on order status changes
- **Analytics**: Aggregate sales data, generate reports
- **Integration**: Connect with external services (payment gateways, shipping providers)

## Setup

### Prerequisites
- Docker installed
- PostgreSQL database running

### Installation

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your credentials

3. Run n8n using Docker:
   ```bash
   docker-compose up n8n
   ```

4. Access n8n UI:
   ```
   http://localhost:5678
   ```
   - Username: admin
   - Password: admin123 (change in .env)

### Running Standalone (without Docker)

```bash
npm install -g n8n
n8n start
```

## Workflow Examples

### 1. Order Confirmation Workflow
- **Trigger**: Webhook from Order Service when order is created
- **Actions**: 
  - Send confirmation email to customer
  - Notify warehouse team
  - Update analytics dashboard

### 2. Low Stock Alert
- **Trigger**: Scheduled check every hour
- **Actions**:
  - Check inventory levels
  - If stock < threshold, send alert to admin
  - Create purchase order automatically

### 3. Abandoned Cart Recovery
- **Trigger**: Scheduled check daily
- **Actions**:
  - Find carts inactive for 24+ hours
  - Send reminder email to customers
  - Offer discount code

### 4. Order Status Update
- **Trigger**: Webhook from shipping provider
- **Actions**:
  - Update order status in database
  - Send tracking update to customer
  - Log in analytics

## API Endpoints

### Webhook URLs

```
POST http://localhost:5678/webhook/order-created
POST http://localhost:5678/webhook/order-completed
POST http://localhost:5678/webhook/order-failed
POST http://localhost:5678/webhook/inventory-low
POST http://localhost:5678/webhook/payment-received
```

## Integration with Services

### Order Service Integration
Add webhook call in order controller after order creation:

```javascript
// After order is created
await fetch('http://localhost:5678/webhook/order-created', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: order.id,
    userId: order.userId,
    totalAmount: order.totalAmount,
    items: order.items
  })
});
```

### Inventory Service Integration
Add webhook call when stock is low:

```javascript
// Check stock levels
if (stock.totalStock < threshold) {
  await fetch('http://localhost:5678/webhook/inventory-low', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: stock.productId,
      currentStock: stock.totalStock,
      threshold: threshold
    })
  });
}
```

## Security

1. Change default credentials in `.env`
2. Use strong encryption key
3. Enable HTTPS in production
4. Restrict webhook access with API keys
5. Use environment variables for sensitive data

## Useful Workflows to Create

1. **Welcome Email**: Send when user signs up
2. **Order Tracking**: Update customers on delivery status
3. **Refund Processing**: Automate refund workflows
4. **Product Review Requests**: Send after order delivery
5. **Sales Reports**: Generate daily/weekly reports
6. **Customer Segmentation**: Tag customers based on behavior
7. **Price Drop Alerts**: Notify customers about product discounts
8. **Subscription Management**: Handle recurring orders

## Troubleshooting

### Workflows not triggering
- Check webhook URLs are correct
- Verify n8n is accessible from services
- Check n8n logs: `docker logs n8n`

### Database connection issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `n8n_db` exists

### Authentication errors
- Verify username/password in `.env`
- Clear browser cache and cookies
- Check N8N_BASIC_AUTH_ACTIVE is set to true

## Documentation

- [n8n Documentation](https://docs.n8n.io/)
- [Workflow Examples](https://n8n.io/workflows)
- [API Reference](https://docs.n8n.io/api/)

## Support

For issues related to n8n, visit [n8n Community](https://community.n8n.io/)
