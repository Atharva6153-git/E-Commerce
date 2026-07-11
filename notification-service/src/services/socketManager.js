/**
 * Socket.IO connection manager.
 * Maps userId -> Set of sockets, so users can connect from multiple tabs.
 */
const userSockets = new Map(); // userId -> Set<socket>

function initSocket(io) {
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket);
      console.log(`Socket connected: ${userId} (${userSockets.get(userId).size} tabs)`);
    }

    socket.on('disconnect', () => {
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(socket);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
        console.log(`Socket disconnected: ${userId}`);
      }
    });
  });

  console.log('Socket.IO ready for real-time notifications');
}

/**
 * Push a notification to a specific user's connected sockets.
 */
function pushToUser(userId, notification) {
  const sockets = userSockets.get(userId);
  if (sockets && sockets.size > 0) {
    for (const socket of sockets) {
      socket.emit('notification', notification);
    }
    console.log(`Pushed notification to ${userId} (${sockets.size} sockets)`);
    return true;
  }
  console.log(`User ${userId} not connected, notification saved to DB only`);
  return false;
}

/**
 * Get count of connected users (for health checks).
 */
function getConnectedCount() {
  return userSockets.size;
}

module.exports = { initSocket, pushToUser, getConnectedCount };
