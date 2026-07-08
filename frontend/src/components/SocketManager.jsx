import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SocketManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Connect directly to the notification service (or through gateway if WS proxy is setup)
    // Gateway is at 4000, notification service path is /api/notifications
    const socket = io('http://localhost:4000', {
      path: '/api/notifications/socket.io',
      query: { userId: user.id }
    });

    socket.on('connect', () => {
      console.log('Connected to notification service WebSocket');
    });

    socket.on('notification', (data) => {
      console.log('New notification:', data);
      
      if (data.type === 'ORDER_CONFIRMED') {
        toast.success(`Order Confirmed! ID: ${data.orderId}`, { duration: 5000 });
      } else if (data.type === 'ORDER_FAILED') {
        toast.error(`Order Failed: ${data.reason}`, { duration: 5000 });
      } else if (data.type === 'PAYMENT_SUCCESS') {
        toast.success(`Payment Success: ₹${data.amount}`, { duration: 5000 });
      } else {
        toast(`Notification: ${data.type}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return null; // This component doesn't render anything visible
};

export default SocketManager;
