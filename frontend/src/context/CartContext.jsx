import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const countItems = (items) =>
  (items || []).reduce((sum, item) => sum + item.quantity, 0);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const applyCartData = useCallback((cartData) => {
    const cartItems = cartData?.items || [];
    setItems(cartItems);
    setItemCount(countItems(cartItems));
  }, []);

  const refreshCart = useCallback(async ({ silent = true } = {}) => {
    if (!user?.id) {
      applyCartData({ items: [] });
      return;
    }

    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/cart/${String(user.id)}`);
      applyCartData(res.data);
    } catch (err) {
      console.error('Failed to refresh cart', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id, applyCartData]);

  useEffect(() => {
    if (user?.id) {
      refreshCart({ silent: false });
    } else {
      applyCartData({ items: [] });
    }
  }, [user?.id, refreshCart, applyCartData]);

  const addToCart = async (productId, quantity = 1) => {
    if (!user?.id) {
      throw new Error('Not logged in');
    }

    setItemCount((prev) => prev + quantity);

    try {
      await api.post(`/cart/${String(user.id)}/items`, { productId, quantity });
      await refreshCart({ silent: true });
    } catch (err) {
      await refreshCart({ silent: true });
      throw err;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (!user?.id || quantity < 1) return;

    const previousItems = items;
    const nextItems = items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setItems(nextItems);
    setItemCount(countItems(nextItems));

    try {
      await api.put(`/cart/${String(user.id)}/items/${productId}`, { quantity });
      await refreshCart({ silent: true });
    } catch (err) {
      setItems(previousItems);
      setItemCount(countItems(previousItems));
      throw err;
    }
  };

  const removeItem = async (productId) => {
    if (!user?.id) return;

    const previousItems = items;
    const nextItems = items.filter((item) => item.productId !== productId);
    setItems(nextItems);
    setItemCount(countItems(nextItems));

    try {
      await api.delete(`/cart/${String(user.id)}/items/${productId}`);
      await refreshCart({ silent: true });
    } catch (err) {
      setItems(previousItems);
      setItemCount(countItems(previousItems));
      throw err;
    }
  };

  const clearCartLocal = useCallback(() => {
    setItems([]);
    setItemCount(0);
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        loading,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCartLocal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
