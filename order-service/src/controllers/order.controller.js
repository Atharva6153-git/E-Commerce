const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  getCart, clearCart, reserveStock, confirmStock, releaseStock,
  createPaymentOrder, verifyPayment, sendNotification,
} = require('../services/clients');

// STEP 1: checkout -> reserve stock -> create Razorpay order, wait for payment
exports.checkout = async (req, res) => {
  // Get userId from headers (set by API Gateway from JWT token)
  const userId = req.headers['x-user-id'] || req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  let order;
  try {
    console.log(`[Checkout] Starting checkout for user: ${userId}`);
    const cart = await getCart(userId);
    console.log(`[Checkout] Cart fetched:`, cart);
    
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty, nothing to checkout' });
    }

    order = await prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        totalAmount: cart.total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceSnapshot: item.priceSnapshot,
          })),
        },
      },
      include: { items: true },
    });
    console.log(`[Checkout] Order created:`, order.id);

    const reserveItems = cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity }));
    console.log(`[Checkout] Reserving stock for items:`, reserveItems);

    try {
      const reserveResult = await reserveStock(order.id, reserveItems);
      console.log(`[Checkout] Stock reserved successfully:`, reserveResult);
    } catch (err) {
      console.error(`[Checkout] Stock reservation failed:`, err.message);
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      return res.status(409).json({ error: `Order failed: ${err.message}`, orderId: order.id, status: 'FAILED' });
    }

    console.log(`[Checkout] Creating payment order...`);
    const paymentOrder = await createPaymentOrder(order.id, cart.total);
    console.log(`[Checkout] Payment order created:`, paymentOrder);

    order = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'AWAITING_PAYMENT' },
      include: { items: true },
    });

    res.status(201).json({
      message: 'Stock reserved, complete payment to confirm order',
      order,
      payment: paymentOrder,
    });
  } catch (err) {
    console.error('[Checkout] Error:', err);
    if (order) {
      await releaseStock(order.id).catch((e) => console.error('[Checkout] Release stock failed:', e.message));
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } }).catch(() => { });
    }
    res.status(500).json({ error: err.message });
  }
};

// STEP 2: complete -> called after the Razorpay popup finishes on the frontend
exports.completeOrder = async (req, res) => {
  const { orderId } = req.params;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } = req.body;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({ error: `Order is not awaiting payment (current status: ${order.status})` });
    }

    const { ok, data } = await verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    if (ok && data.success) {
      await confirmStock(orderId);
      await clearCart(order.userId);
      const confirmed = await prisma.order.update({
        where: { id: orderId }, data: { status: 'CONFIRMED' }, include: { items: true },
      });
      // Notify user of confirmation (fire-and-forget)
      sendNotification(order.userId, 'ORDER_CONFIRMED', {
        orderId,
        amount: order.totalAmount.toString(),
        itemCount: order.items.length,
      }, email);
      return res.json({ message: 'Order confirmed', order: confirmed, payment: data.payment });
    } else {
      await releaseStock(orderId);
      const failed = await prisma.order.update({
        where: { id: orderId }, data: { status: 'FAILED' }, include: { items: true },
      });
      // Notify user of failure (fire-and-forget)
      sendNotification(order.userId, 'ORDER_FAILED', { orderId, reason: 'Payment verification failed' }, email);
      return res.status(402).json({ message: 'Payment verification failed, stock released', order: failed });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.params.userId }, include: { items: true }, orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};