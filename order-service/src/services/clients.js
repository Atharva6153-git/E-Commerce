const CART_URL = process.env.CART_SERVICE_URL || 'http://localhost:4004';
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4003';

async function getCart(userId) {
  const res = await fetch(`${CART_URL}/cart/${userId}`);
  if (!res.ok) throw new Error('Could not fetch cart from Cart Service');
  return res.json();
}

async function clearCart(userId) {
  const res = await fetch(`${CART_URL}/cart/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Could not clear cart in Cart Service');
  return res.json();
}

async function reserveStock(orderId, items) {
  const res = await fetch(`${INVENTORY_URL}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, items }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Stock reservation failed');
  return data;
}

async function confirmStock(orderId) {
  const res = await fetch(`${INVENTORY_URL}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Stock confirmation failed');
  return data;
}

async function releaseStock(orderId) {
  const res = await fetch(`${INVENTORY_URL}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Stock release failed');
  return data;
}

const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4006';

async function createPaymentOrder(orderId, amount) {
  const res = await fetch(`${PAYMENT_URL}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Payment order creation failed');
  return data;
}

async function verifyPayment(razorpayFields) {
  const res = await fetch(`${PAYMENT_URL}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(razorpayFields),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007';
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

/**
 * Fetch the user's email from the Auth Service.
 * Returns the email string, or null if unavailable.
 */
async function getUserEmail(userId) {
  try {
    const res = await fetch(`${AUTH_URL}/api/auth/user/${userId}`);
    if (!res.ok) return null;
    const user = await res.json();
    return user.email || null;
  } catch {
    return null;
  }
}

/**
 * Send a notification (fire-and-forget — never blocks the caller).
 * @param {string} userId
 * @param {string} type - ORDER_CONFIRMED | ORDER_FAILED | PAYMENT_SUCCESS
 * @param {object} data - { orderId, amount, itemCount, reason, paymentId }
 * @param {string|null} email - optional, pass directly or we'll try to look it up
 */
async function sendNotification(userId, type, data, email = null) {
  try {
    // If no email provided, try fetching from Auth Service
    if (!email) {
      email = await getUserEmail(userId);
    }

    await fetch(`${NOTIFICATION_URL}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, email, ...data }),
    });
  } catch (err) {
    // Fire-and-forget: log but don't throw
    console.error(`[Order] Notification failed (non-critical): ${err.message}`);
  }
}

module.exports = {
  getCart, clearCart, reserveStock, confirmStock, releaseStock,
  createPaymentOrder, verifyPayment, sendNotification,
};
