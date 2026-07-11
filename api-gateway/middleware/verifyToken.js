const jwt = require('jsonwebtoken');

// This middleware protects routes that require a logged-in user.
// Normally expects header: Authorization: Bearer <token>
// FALLBACK: also accepts ?token=<token> in the query string, because
// Socket.IO's initial polling handshake (used by the Notification Service)
// cannot reliably attach custom headers from the browser.
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = verifyToken;