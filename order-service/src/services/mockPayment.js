/**
 * MOCK PAYMENT — placeholder until Payment Service (Razorpay) is built.
 * Once Payment Service exists, this function gets replaced with a real
 * HTTP call to it. The rest of the saga in order.controller.js doesn't
 * change at all — that's the whole point of separating concerns this way.
 *
 * For testing: pass forceFail: true in the checkout request body to
 * deliberately simulate a failed payment and watch the release/compensating
 * transaction kick in.
 */
async function processPayment({ orderId, amount, forceFail }) {
  // simulate network delay like a real payment gateway call
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (forceFail) {
    return { success: false, reason: 'Payment declined (simulated failure)' };
  }

  return { success: true, transactionId: `mock_txn_${orderId.slice(0, 8)}`, amount };
}

module.exports = { processPayment };
