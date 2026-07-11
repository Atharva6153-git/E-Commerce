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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
