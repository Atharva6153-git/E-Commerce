/**
 * Styled HTML email templates for E-ShopX notifications.
 * Each function returns { subject, html }.
 */

function baseLayout(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:#1a1a2e; font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e; padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="520" cellpadding="0" cellspacing="0" style="background-color:#16213e; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.3);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:28px 32px; text-align:center;">
                <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700;">⚡ E-ShopX</h1>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:32px;">
                ${content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px; border-top:1px solid rgba(255,255,255,0.08); text-align:center;">
                <p style="margin:0; color:#6b7280; font-size:12px;">
                  This is an automated notification from E-ShopX.<br/>
                  © 2026 E-ShopX — All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

function orderConfirmed({ orderId, amount, itemCount }) {
  const content = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="display:inline-block; background:rgba(52,211,153,0.15); border-radius:50%; width:64px; height:64px; line-height:64px; font-size:32px;">
        ✅
      </div>
    </div>
    <h2 style="color:#6ee7b7; font-size:22px; text-align:center; margin:0 0 8px 0;">Order Confirmed!</h2>
    <p style="color:#9ca3af; text-align:center; margin:0 0 28px 0; font-size:14px;">
      Your order has been confirmed and is being processed.
    </p>
    <table width="100%" cellpadding="12" cellspacing="0" style="background:rgba(255,255,255,0.04); border-radius:12px; margin-bottom:24px;">
      <tr>
        <td style="color:#9ca3af; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">Order ID</td>
        <td style="color:#e0e0e0; font-size:13px; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06); font-family:monospace;">${orderId}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">Items</td>
        <td style="color:#e0e0e0; font-size:13px; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06);">${itemCount || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af; font-size:13px;">Total Amount</td>
        <td style="color:#6ee7b7; font-size:16px; font-weight:700; text-align:right;">₹${amount}</td>
      </tr>
    </table>
    <p style="color:#6b7280; font-size:13px; text-align:center;">
      Thank you for shopping with E-ShopX! 🎉
    </p>`;

  return {
    subject: `✅ Order Confirmed — ₹${amount}`,
    html: baseLayout(content),
  };
}

function orderFailed({ orderId, reason }) {
  const content = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="display:inline-block; background:rgba(248,113,113,0.15); border-radius:50%; width:64px; height:64px; line-height:64px; font-size:32px;">
        ❌
      </div>
    </div>
    <h2 style="color:#fca5a5; font-size:22px; text-align:center; margin:0 0 8px 0;">Order Failed</h2>
    <p style="color:#9ca3af; text-align:center; margin:0 0 28px 0; font-size:14px;">
      Unfortunately, your order could not be processed.
    </p>
    <table width="100%" cellpadding="12" cellspacing="0" style="background:rgba(255,255,255,0.04); border-radius:12px; margin-bottom:24px;">
      <tr>
        <td style="color:#9ca3af; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">Order ID</td>
        <td style="color:#e0e0e0; font-size:13px; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06); font-family:monospace;">${orderId}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af; font-size:13px;">Reason</td>
        <td style="color:#fca5a5; font-size:13px; text-align:right;">${reason || 'Payment verification failed'}</td>
      </tr>
    </table>
    <p style="color:#6b7280; font-size:13px; text-align:center;">
      Please try placing your order again or contact support.
    </p>`;

  return {
    subject: `❌ Order Failed — ${orderId.slice(0, 8)}…`,
    html: baseLayout(content),
  };
}

function paymentSuccess({ orderId, amount, paymentId }) {
  const content = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="display:inline-block; background:rgba(129,140,248,0.15); border-radius:50%; width:64px; height:64px; line-height:64px; font-size:32px;">
        💳
      </div>
    </div>
    <h2 style="color:#a5b4fc; font-size:22px; text-align:center; margin:0 0 8px 0;">Payment Received!</h2>
    <p style="color:#9ca3af; text-align:center; margin:0 0 28px 0; font-size:14px;">
      We've successfully received your payment.
    </p>
    <table width="100%" cellpadding="12" cellspacing="0" style="background:rgba(255,255,255,0.04); border-radius:12px; margin-bottom:24px;">
      <tr>
        <td style="color:#9ca3af; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">Order ID</td>
        <td style="color:#e0e0e0; font-size:13px; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06); font-family:monospace;">${orderId}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af; font-size:13px; border-bottom:1px solid rgba(255,255,255,0.06);">Payment ID</td>
        <td style="color:#e0e0e0; font-size:13px; text-align:right; border-bottom:1px solid rgba(255,255,255,0.06); font-family:monospace;">${paymentId || 'N/A'}</td>
      </tr>
      <tr>
        <td style="color:#9ca3af; font-size:13px;">Amount Paid</td>
        <td style="color:#6ee7b7; font-size:16px; font-weight:700; text-align:right;">₹${amount}</td>
      </tr>
    </table>`;

  return {
    subject: `💳 Payment Received — ₹${amount}`,
    html: baseLayout(content),
  };
}

module.exports = { orderConfirmed, orderFailed, paymentSuccess };
