const path = require('path');
const { execFileSync } = require('child_process');

const BASE = path.resolve(__dirname, '..', '..');

// Repo-root sibling service directories (relative to BASE, which is order-service).
const SERVICE_DIRS = {
  order: BASE,
  inventory: path.resolve(BASE, '..', 'inventory-service'),
  payment: path.resolve(BASE, '..', 'payment-service'),
};

// Each service has its OWN generated Prisma client in its own node_modules.
// Because these helpers run from inside the Jest process (order-service's cwd),
// a bare `require('@prisma/client')` would resolve to order-service's client,
// which does NOT contain the inventory/payment models. So load each explicitly.
const loadClient = (service) => {
  const mod = require(path.join(SERVICE_DIRS[service], 'node_modules', '@prisma', 'client'));
  return mod.PrismaClient;
};

// Instantiate a client pointed at the given test DB via the right generated client.
const clientFor = (service, url) => new (loadClient(service))({ datasources: { db: { url } } });

// Isolated test DBs (see docker-compose.yml test services).
const DB_URLS = {
  order: process.env.TEST_DB_ORDER_URL || 'postgresql://admin:admin123@localhost:5447/order_test',
  inventory: process.env.TEST_DB_INVENTORY_URL || 'postgresql://admin:admin123@localhost:5448/inventory_test',
  payment: process.env.TEST_DB_PAYMENT_URL || 'postgresql://admin:admin123@localhost:5449/payment_test',
};

// Known ids used by seeding so tests can assert deterministic values.
const PRODUCTS = {
  laptop: '11111111-1111-1111-1111-111111111111',
  mouse: '22222222-2222-2222-2222-222222222222',
};

const USER_ID = '33333333-3333-3333-3333-333333333333';

/**
 * Apply the Prisma schema to a fresh test DB so it mirrors the service schema.
 * Uses `prisma db push` (fast, idempotent on an empty DB).
 */
function applySchema() {
  const targets = [
    { service: 'order', schema: path.join(SERVICE_DIRS.order, 'prisma', 'schema.prisma') },
    { service: 'inventory', schema: path.join(SERVICE_DIRS.inventory, 'prisma', 'schema.prisma') },
    { service: 'payment', schema: path.join(SERVICE_DIRS.payment, 'prisma', 'schema.prisma') },
  ];

  for (const t of targets) {
    const url = DB_URLS[t.service];
    const cli = path.join(SERVICE_DIRS[t.service], 'node_modules', 'prisma', 'build', 'index.js');
    execFileSync(
      process.execPath,
      [cli, 'db', 'push', '--skip-generate', '--force-reset', '--schema', t.schema],
      { env: { ...process.env, DATABASE_URL: url, CI: 'true' }, stdio: 'pipe', timeout: 120000 }
    );
    // eslint-disable-next-line no-console
    console.log(`[testDb] schema applied for ${t.service}`);
  }
}

/**
 * Seed inventory + order data into the test DBs.
 */
async function seed() {
  const inventory = clientFor('inventory', DB_URLS.inventory);
  try {
    await inventory.stock.createMany({
      data: [
        { productId: PRODUCTS.laptop, totalStock: 10, reservedStock: 0 },
        { productId: PRODUCTS.mouse, totalStock: 5, reservedStock: 0 },
      ],
    });
  } finally {
    await inventory.$disconnect();
  }
}

/**
 * Wipe all application tables in every test DB so each run starts clean.
 */
async function clearTables() {
  const order = clientFor('order', DB_URLS.order);
  const inventory = clientFor('inventory', DB_URLS.inventory);
  const payment = clientFor('payment', DB_URLS.payment);
  try {
    await order.$executeRawUnsafe('TRUNCATE TABLE "Order" CASCADE;');
    await order.$executeRawUnsafe('TRUNCATE TABLE "OrderItem" CASCADE;');
    await inventory.$executeRawUnsafe('TRUNCATE TABLE "Stock" CASCADE;');
    await inventory.$executeRawUnsafe('TRUNCATE TABLE "Reservation" CASCADE;');
    await payment.$executeRawUnsafe('TRUNCATE TABLE "Payment" CASCADE;');
  } finally {
    await order.$disconnect();
    await inventory.$disconnect();
    await payment.$disconnect();
  }
}

/**
 * After all tests, leave a clean slate.
 */
async function teardown() {
  await clearTables();
}

module.exports = { DB_URLS, PRODUCTS, USER_ID, applySchema, seed, clearTables, teardown, clientFor };
