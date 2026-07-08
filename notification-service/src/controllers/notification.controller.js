const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendEmail } = require('../services/mailer');
const { pushToUser } = require('../services/socketManager');
const emailTemplates = require('../templates/emails');

/**
 * POST /notifications/send
 * Called by other services (e.g. Order Service) to trigger a notification.
 *
 * Body: { userId, type, email?, orderId?, amount?, itemCount?, reason?, paymentId? }
 */
exports.send = async (req, res) => {
  try {
    const { userId, type, email, orderId, amount, itemCount, reason, paymentId } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type are required' });
    }

    // ── Build the email content from template ────────────────────
    let template;
    switch (type) {
      case 'ORDER_CONFIRMED':
        template = emailTemplates.orderConfirmed({ orderId, amount, itemCount });
        break;
      case 'ORDER_FAILED':
        template = emailTemplates.orderFailed({ orderId, reason });
        break;
      case 'PAYMENT_SUCCESS':
        template = emailTemplates.paymentSuccess({ orderId, amount, paymentId });
        break;
      default:
        template = {
          subject: `E-ShopX Notification — ${type}`,
          html: `<p>Notification type: ${type}</p><p>Order: ${orderId || 'N/A'}</p>`,
        };
    }

    // ── Send email if we have an address ─────────────────────────
    let emailResult = { previewUrl: null };
    const channel = email ? 'BOTH' : 'IN_APP';

    if (email) {
      emailResult = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
      });
    }

    // ── Push real-time via Socket.IO ─────────────────────────────
    const inAppPayload = {
      type,
      subject: template.subject,
      orderId,
      amount,
      timestamp: new Date().toISOString(),
    };
    pushToUser(userId, inAppPayload);

    // ── Persist to database ──────────────────────────────────────
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        channel,
        subject: template.subject,
        body: template.html,
        email: email || null,
        metadata: { orderId, amount, itemCount, reason, paymentId, previewUrl: emailResult.previewUrl },
        status: 'SENT',
      },
    });

    res.status(201).json({
      message: 'Notification sent',
      notificationId: notification.id,
      channel,
      emailPreviewUrl: emailResult.previewUrl || null,
    });
  } catch (err) {
    console.error('Notification error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /notifications/:userId
 * Fetch notification history for a user (most recent first).
 */
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        channel: true,
        subject: true,
        metadata: true,
        status: true,
        readAt: true,
        createdAt: true,
      },
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /notifications/:id/read
 * Mark a notification as read.
 */
exports.markRead = async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() },
    });
    res.json({ message: 'Marked as read', notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
