require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const verifyToken = require('./middleware/verifyToken');

const app = express();
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// --- PUBLIC ROUTE ---
// Signup/login don't need a token (that's how you GET a token), so this
// route is forwarded to Auth Service WITHOUT verifyToken.
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
  })
);

// --- PUBLIC ROUTE ---
// Product browsing doesn't need a token, forwarded to Catalog Service.
app.use(
  '/api/catalog',
  createProxyMiddleware({
    target: process.env.CATALOG_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/catalog': '' },
  })
);

// --- PROTECTED TEST ROUTE ---
// This proves the gateway can verify a JWT issued by Auth Service.
// Later, other protected routes (cart, orders, etc.) will use this same pattern.
app.get('/api/me', verifyToken, (req, res) => {
  res.json({ message: 'Token is valid, gateway verified you.', user: req.user });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
