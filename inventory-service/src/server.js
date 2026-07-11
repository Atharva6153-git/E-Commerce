const express = require('express');
const cors = require('cors');
const inventoryRoutes = require('./routes/inventory.routes');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'inventory' }));
app.use('/', inventoryRoutes);

// Catch-all error handler — if any route throws an error that wasn't
// caught locally, respond with clean JSON instead of an HTML error page
// (which crashes JSON.parse on the caller's side, e.g. order-service).
app.use((err, req, res, next) => {
  console.error('[Inventory] Unhandled route error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4003;

const server = app.listen(PORT, () => console.log(`Inventory Service running on port ${PORT}`));

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
// dropped database connection from Neon's free-tier auto-suspend) can
// crash the ENTIRE Node process. Render then has to cold-start the
// service again, which can take 10-15+ minutes of downtime. These
// handlers log the error and keep the service alive instead of
// letting it die.
// ---------------------------------------------------------------
process.on('unhandledRejection', (reason) => {
  console.error('[Inventory] Unhandled Promise Rejection (service staying alive):', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Inventory] Uncaught Exception (service staying alive):', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});