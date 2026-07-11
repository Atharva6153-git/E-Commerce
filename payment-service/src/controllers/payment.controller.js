const { PrismaClient } = require('@prisma/client');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Test database connection on startup
prisma.$connect()
  .then(() => console.log('Payment Service: Database connected'))
  .catch((err) => {
    console.error('Payment Service: Database connection failed:', err.message);
    console.warn('Payment Service: Will retry connection on first request');
  });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log('Payment Service: Razorpay initialized with key:', process.env.RAZORPAY_KEY_ID ? 'Present' : 'Missing');

/**
 * CREATE ORDER
 * Called by Order Service (or directly by the frontend) once an internal
 * order has been created and stock reserved. Creates a matching order on
 * Razorpay's side and returns what the frontend checkout widget needs.
 */
exports.createOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'orderId and amount are required' });
    }

    // Razorpay expects amount in the smallest currency unit (paise for INR)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId,
    });

    const payment = await prisma.payment.create({
      data: {
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount,
        status: 'CREATED',
      },
    });

    res.status(201).json({
      paymentId: payment.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // safe to expose, needed by the checkout widget
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * VERIFY PAYMENT
 * Called after the Razorpay checkout widget completes on the frontend.
 * This is the security-critical step: we recompute the HMAC signature
 * ourselves and compare it, rather than trusting whatever the client sends.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay verification fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    const payment = await prisma.payment.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        status: isValid ? 'PAID' : 'FAILED',
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Signature verification failed', payment });
    }

    res.json({ success: true, message: 'Payment verified successfully', payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentByOrderId = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { orderId: req.params.orderId } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
