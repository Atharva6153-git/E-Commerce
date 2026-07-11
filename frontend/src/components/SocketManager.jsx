import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SocketManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('eshopx_token');
    if (!token) return;

    const socket = io('https://eshopx-api-gateway.onrender.com', {
      path: '/api/notifications/socket.io',
      query: { userId: user.id, token }
    });

    socket.on('connect', () => {
      console.log('Connected to notification service WebSocket');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
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

  return null;
};

export default SocketManager;