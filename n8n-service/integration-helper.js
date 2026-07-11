/**
 * n8n Integration Helper
 * Utility functions to trigger n8n workflows from your services
 */

const N8N_BASE_URL = process.env.N8N_URL || 'http://localhost:5678';

/**
 * Trigger n8n workflow via webhook
 * @param {string} webhookPath - The webhook path (e.g., 'order-created')
 * @param {object} data - Data to send to the workflow
 * @returns {Promise<object>} Response from n8n
 */
async function triggerWorkflow(webhookPath, data) {
  try {
    const response = await fetch(`${N8N_BASE_URL}/webhook/${webhookPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error(`[n8n] Workflow trigger failed: ${response.status}`);
      return { success: false, error: response.statusText };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('[n8n] Failed to trigger workflow:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Trigger order created workflow
 * @param {object} orderData - Order details
 */
async function notifyOrderCreated(orderData) {
  return triggerWorkflow('order-created', {
    orderId: orderData.id,
    userId: orderData.userId,
    totalAmount: orderData.totalAmount,
    items: orderData.items,
    email: orderData.email,
    status: orderData.status,
    createdAt: orderData.createdAt,
  });
}

/**
 * Trigger order completed workflow
 * @param {object} orderData - Order details
 */
async function notifyOrderCompleted(orderData) {
  return triggerWorkflow('order-completed', {
    orderId: orderData.id,
    userId: orderData.userId,
    totalAmount: orderData.totalAmount,
    email: orderData.email,
    completedAt: new Date().toISOString(),
  });
}

/**
 * Trigger order failed workflow
 * @param {object} orderData - Order details
 */
async function notifyOrderFailed(orderData) {
  return triggerWorkflow('order-failed', {
    orderId: orderData.id,
    userId: orderData.userId,
    reason: orderData.reason,
    email: orderData.email,
    failedAt: new Date().toISOString(),
  });
}

/**
 * Trigger low stock alert workflow
 * @param {object} stockData - Stock details
 */
async function notifyLowStock(stockData) {
  return triggerWorkflow('inventory-low', {
    productId: stockData.productId,
    productName: stockData.productName,
    currentStock: stockData.totalStock,
    threshold: stockData.threshold,
    alertLevel: stockData.totalStock < 5 ? 'CRITICAL' : 'WARNING',
  });
}

/**
 * Trigger payment received workflow
 * @param {object} paymentData - Payment details
 */
async function notifyPaymentReceived(paymentData) {
  return triggerWorkflow('payment-received', {
    orderId: paymentData.orderId,
    paymentId: paymentData.paymentId,
    amount: paymentData.amount,
    method: paymentData.method,
    status: paymentData.status,
    paidAt: new Date().toISOString(),
  });
}

/**
 * Trigger user signup workflow
 * @param {object} userData - User details
 */
async function notifyUserSignup(userData) {
  return triggerWorkflow('user-signup', {
    userId: userData.id,
    name: userData.name,
    email: userData.email,
    signupAt: new Date().toISOString(),
  });
}

/**
 * Trigger cart abandoned workflow
 * @param {object} cartData - Cart details
 */
async function notifyCartAbandoned(cartData) {
  return triggerWorkflow('cart-abandoned', {
    userId: cartData.userId,
    email: cartData.email,
    cartValue: cartData.total,
    itemCount: cartData.items.length,
    abandonedAt: new Date().toISOString(),
  });
}

module.exports = {
  triggerWorkflow,
  notifyOrderCreated,
  notifyOrderCompleted,
  notifyOrderFailed,
  notifyLowStock,
  notifyPaymentReceived,
  notifyUserSignup,
  notifyCartAbandoned,
};
