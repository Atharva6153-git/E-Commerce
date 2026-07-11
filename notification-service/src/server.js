require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const notificationRoutes = require('./routes/notification.routes');
const { initMailer } = require('./services/mailer');
const { initSocket, getConnectedCount } = require('./services/socketManager');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'notification',
    connectedClients: getConnectedCount(),
  });
});

app.use('/notifications', notificationRoutes);

// Create HTTP server for both Express and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  path: '/notifications/socket.io',
  cors: { origin: '*' },
});

// Initialize Socket.IO
initSocket(io);

const PORT = process.env.PORT || 4007;

// Initialize mailer, then start the server
initMailer().then(() => {
  server.listen(PORT, () => {
    console.log(`ðŸ”” Notification Service running on port ${PORT}`);
  });
});
