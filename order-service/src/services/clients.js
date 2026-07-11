const CART_URL = process.env.CART_SERVICE_URL || 'http://localhost:4004';
const INVENTORY_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4003';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4006';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4007';
const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

/**
 * fetchWithRetry
 * - Adds a timeout to every request (so a sleeping Render service doesn't hang forever)
 * - Retries a few times with a short delay (handles Render free-tier cold starts)
 * - Safely parses the response: if the server returns HTML or plain text
 *   (like "Too Many Requests" or a Render error page) instead of JSON,
 *   this throws a clear error instead of crashing on JSON.parse.
 *
 * @param {string} url
 * @param {object} options - normal fetch options (method, headers, body)
 * @param {object} config - { retries, timeoutMs, retryDelayMs }
 */
async function fetchWithRetry(url, options = {}, config = {}) {
  const {
    retries = 2,        // how many EXTRA attempts after the first try
    timeoutMs = 10000,  // 10s timeout per attempt
    retryDelayMs = 1500 // wait 1.5s between retries
  } = config;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      // Read the raw text first — never assume it's JSON
      const rawText = await res.text();

      let data;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseErr) {
        // Server sent back HTML or plain text (cold start / rate-limit / crash page)
        const preview = rawText.slice(0, 80).replace(/\s+/g, ' ');
        throw new Error(
          `Service at ${url} returned a non-JSON response (status ${res.status}): "${preview}..."`
        );
      }

      if (!res.ok) {
        throw new Error(data.error || `Request to ${url} failed with status ${res.status}`);
      }

      return data; // success
    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      const isLastAttempt = attempt === retries;
      if (isLastAttempt) break;

      console.warn(
        `[Order] Attempt ${attempt + 1} to ${url} failed (${err.message}). Retrying in ${retryDelayMs}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError;
}

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
  return fetchWithRetry(`${INVENTORY_URL}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, items }),
  });
}

async function confirmStock(orderId) {
  return fetchWithRetry(`${INVENTORY_URL}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
}

async function releaseStock(orderId) {
  return fetchWithRetry(`${INVENTORY_URL}/release`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
}

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