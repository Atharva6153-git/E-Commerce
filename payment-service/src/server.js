const express = require('express');
const cors = require('cors');
const path = require('path');
const paymentRoutes = require('./routes/payment.routes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment' }));
app.use('/payment', paymentRoutes);

// Catch-all error handler — if any route throws an error that wasn't
// caught locally, respond with clean JSON instead of letting Express
// send back an HTML error page (which crashes JSON.parse on the caller's side).
app.use((err, req, res, next) => {
  console.error('[Payment] Unhandled route error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4006;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

// ---------------------------------------------------------------
// CRITICAL: Process-level safety net.
// Without these, an error that escapes all try/catch blocks (e.g. a
// dropped database connection from Neon's free-tier auto-suspend,
// or an internal Prisma engine hiccup) can crash the ENTIRE Node
// process. Render then has to cold-start the service again, which
// can take 10-15+ minutes of downtime. These handlers log the error
// and keep the service alive instead of letting it die.
// ---------------------------------------------------------------
process.on('unhandledRejection', (reason) => {
  console.error('[Payment] Unhandled Promise Rejection (service staying alive):', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Payment] Uncaught Exception (service staying alive):', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});