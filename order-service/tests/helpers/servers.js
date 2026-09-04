const path = require('path');
const express = require('express');
const { DB_URLS, PRODUCTS } = require('./testDb');

// Repo root: helpers -> tests -> order-service -> online-shopping-system
const ROOT = path.resolve(__dirname, '..', '..', '..');

// Test ports (avoid the live dev ports 4003-4007 and the gateway 4000).
const PORTS = {
  order: 4105,
  inventory: 4103,
  payment: 4106,
  cart: 4104,
  notification: 4107,
};

const CART_DATA = {
  productId: PRODUCTS.laptop,
  quantity: 2,
  priceSnapshot: 500.0,
};

let paymentServer;
let cartServer;
let orderServer;
let inventoryServer;
let notificationServer;
let notificationReceived = [];

function startStubCart() {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    app.get('/cart/:userId', (req, res) => {
      res.json({
        userId: req.params.userId,
        items: [CART_DATA],
        total: CART_DATA.priceSnapshot * CART_DATA.quantity,
      });
    });
    app.delete('/cart/:userId', (req, res) => res.json({ message: 'Cart cleared' }));
    cartServer = app.listen(PORTS.cart, () => resolve(cartServer));
    cartServer.on('error', reject);
  });
}

function startStubNotification() {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());
    notificationReceived = [];
    app.post('/notifications/send', (req, res) => {
      notificationReceived.push(req.body);
      res.json({ ok: true });
    });
    notificationServer = app.listen(PORTS.notification, () => resolve());
    notificationServer.on('error', reject);
  });
}

// Mount a real service's routes onto its own Express app and listen on a test
// port, all inside the Jest process. This keeps every service's HTTP surface
// real (they talk to each other over HTTP) without fragile child-process spawns.
async function mountService(dirName, routeFile, mountPath, port) {
  // Point the service's Prisma client at ITS test DB before it is required.
  const service = dirName.replace('-service', '');
  process.env.DATABASE_URL = DB_URLS[service];
  if (service === 'payment') {
    process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_fake';
    process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'fake_razorpay_secret';
  }
  const routes = require(path.join(ROOT, dirName, 'src', 'routes', routeFile));
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => res.json({ status: 'ok', service }));
  app.use(mountPath, routes);
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(server));
    server.on('error', reject);
  });
}

async function startWorld() {
  // Stubs first so the order service can reach them.
  await startStubNotification();
  await startStubCart();

  // Payment in-process (Razorpay is module-mocked).
  paymentServer = await mountService('payment-service', 'payment.routes', '/payment', PORTS.payment);

  // Set inter-service URLs BEFORE requiring the order service so clients.js
  // picks up the test endpoints (payment/cart already required above).
  process.env.CART_SERVICE_URL = `http://localhost:${PORTS.cart}`;
  process.env.INVENTORY_SERVICE_URL = `http://localhost:${PORTS.inventory}`;
  process.env.PAYMENT_SERVICE_URL = `http://localhost:${PORTS.payment}`;
  process.env.NOTIFICATION_SERVICE_URL = `http://localhost:${PORTS.notification}`;
  orderServer = await mountService('order-service', 'order.routes', '/orders', PORTS.order);

  inventoryServer = await mountService('inventory-service', 'inventory.routes', '/', PORTS.inventory);

  return { getNotifications: () => notificationReceived };
}

async function stopWorld() {
  const close = (s) => new Promise((r) => (s && s.close ? s.close(() => r()) : r()));
  await close(orderServer);
  await close(inventoryServer);
  await close(paymentServer);
  await close(cartServer);
  await close(notificationServer);
  orderServer = null; inventoryServer = null; paymentServer = null; cartServer = null;
  notificationServer = null;
}

module.exports = { PORTS, startWorld, stopWorld, CART_DATA };
