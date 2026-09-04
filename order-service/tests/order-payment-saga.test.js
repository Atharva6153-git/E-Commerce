const crypto = require('crypto');
const supertest = require('supertest');
const { DB_URLS, PRODUCTS, applySchema, seed, clearTables, teardown, clientFor } = require('./helpers/testDb');
const { PORTS, startWorld, stopWorld, CART_DATA } = require('./helpers/servers');

// Controllable fake Razorpay (mapped via jest.config moduleNameMapper).
// `orders.create` is a jest.fn() we drive for success/failure.
const MockRazorpay = require('./__mocks__/razorpay');
const mockRazorpayOrdersCreate = MockRazorpay.__ordersCreate;

const RAZORPAY_SECRET = 'fake_razorpay_secret';

// Sign the payload the same way payment.controller does:
//   HMAC-SHA256( key_secret, `${razorpay_order_id}|${razorpay_payment_id}` )
function makeSignature(orderId, paymentId) {
  return crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

// Each service generates its OWN Prisma client, so use the right one for the
// DB being queried (order/inventory/payment models live in different clients).
const prismaOrder = () => clientFor('order', DB_URLS.order);
const prismaInventory = () => clientFor('inventory', DB_URLS.inventory);
const prismaPayment = () => clientFor('payment', DB_URLS.payment);

const orderBase = `http://localhost:${PORTS.order}`;
const inventoryBase = `http://localhost:${PORTS.inventory}`;

describe('Order-Payment saga', () => {
  let world;

  beforeAll(async () => {
    applySchema();
    world = await startWorld();
  }, 180000);

  beforeEach(async () => {
    await clearTables();
    await seed();
    // Reset the Razorpay mock to a successful order by default.
    mockRazorpayOrdersCreate.mockReset();
    mockRazorpayOrdersCreate.mockResolvedValue({
      id: `order_${Date.now()}`,
      amount: Math.round(CART_DATA.priceSnapshot * CART_DATA.quantity * 100),
      currency: 'INR',
    });
  });

  afterAll(async () => {
    await teardown();
    await stopWorld();
  }, 60000);

  // Helper: run the full checkout via the spawned (real) order service.
  async function checkout() {
    const res = await supertest(orderBase)
      .post('/orders/checkout')
      .set('x-user-id', '33333333-3333-3333-3333-333333333333')
      .send({});
    return res;
  }

  async function readOrder(orderId) {
    const o = prismaOrder();
    try {
      return await o.order.findUnique({ where: { id: orderId }, include: { items: true } });
    } finally {
      await o.$disconnect();
    }
  }

  async function readReservation(orderId) {
    const i = prismaInventory();
    try {
      return await i.reservation.findMany({ where: { orderId } });
    } finally {
      await i.$disconnect();
    }
  }

  async function readStock(productId = PRODUCTS.laptop) {
    const i = prismaInventory();
    try {
      return await i.stock.findUnique({ where: { productId } });
    } finally {
      await i.$disconnect();
    }
  }

  test('HAPPY PATH: order -> payment success -> inventory decremented, order CONFIRMED', async () => {
    // 1. Checkout reserves stock and returns a Razorpay order.
    const checkoutRes = await checkout();
    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.order.status).toBe('AWAITING_PAYMENT');
    expect(checkoutRes.body.payment.razorpayOrderId).toMatch(/^order_/);

    const orderId = checkoutRes.body.order.id;
    const razorpayOrderId = checkoutRes.body.payment.razorpayOrderId;

    // Stock should be reserved (available reduced) but not yet deducted.
    let stock = await readStock();
    expect(stock.reservedStock).toBe(CART_DATA.quantity);
    expect(stock.totalStock).toBe(10);

    // 2. Complete with a VALID signature -> success branch.
    const paymentId = 'pay_' + Date.now();
    const signature = makeSignature(razorpayOrderId, paymentId);
    const completeRes = await supertest(orderBase)
      .post(`/orders/${orderId}/complete`)
      .send({ razorpay_order_id: razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.order.status).toBe('CONFIRMED');

    // Inventory decremented: totalStock 10 -> 8, reservedStock -> 0.
    stock = await readStock();
    expect(stock.totalStock).toBe(8);
    expect(stock.reservedStock).toBe(0);

    // Reservation moved PENDING -> CONFIRMED.
    const reservations = await readReservation(orderId);
    expect(reservations).toHaveLength(1);
    expect(reservations[0].status).toBe('CONFIRMED');

    // Payment marked PAID.
    const p = prismaPayment();
    const payment = await p.payment.findUnique({ where: { orderId } });
    await p.$disconnect();
    expect(payment.status).toBe('PAID');

    // Order DB state.
    const order = await readOrder(orderId);
    expect(order.status).toBe('CONFIRMED');
    expect(Number(order.totalAmount)).toBe(1000);
  });

  test('FAILURE PATH: invalid payment signature -> compensating release, order FAILED', async () => {
    const checkoutRes = await checkout();
    expect(checkoutRes.status).toBe(201);
    const orderId = checkoutRes.body.order.id;
    const razorpayOrderId = checkoutRes.body.payment.razorpayOrderId;

    // Stock reserved first.
    let stock = await readStock();
    expect(stock.reservedStock).toBe(CART_DATA.quantity);

    // Call complete with a FORGED (invalid) signature.
    const completeRes = await supertest(orderBase)
      .post(`/orders/${orderId}/complete`)
      .send({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: 'pay_forged',
        razorpay_signature: 'not-a-real-signature',
      });

    // Payment service marks FAILED and returns 400; order service responds 402.
    expect(completeRes.status).toBe(402);
    expect(completeRes.body.order.status).toBe('FAILED');

    // Compensating transaction: reserved stock released back.
    stock = await readStock();
    expect(stock.totalStock).toBe(10); // never deducted
    expect(stock.reservedStock).toBe(0); // released fully

    // Reservation moved PENDING -> RELEASED.
    const reservations = await readReservation(orderId);
    expect(reservations).toHaveLength(1);
    expect(reservations[0].status).toBe('RELEASED');

    // Order marked FAILED in DB.
    const order = await readOrder(orderId);
    expect(order.status).toBe('FAILED');
  });

  test('FAILURE PATH: Razorpay order creation fails -> stock released, order FAILED', async () => {
    // Make the mocked Razorpay order creation fail.
    mockRazorpayOrdersCreate.mockRejectedValue(new Error('Razorpay is down'));

    const checkoutRes = await checkout();
    // Order service catches the error, releases stock, marks order failed -> 500.
    expect(checkoutRes.status).toBe(500);

    // Stock fully released (nothing leaked).
    const stock = await readStock();
    expect(stock.totalStock).toBe(10);
    expect(stock.reservedStock).toBe(0);
  });
});
