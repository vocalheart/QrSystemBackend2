import React, { createContext, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [NotificationCount, setNotificationCount] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL

  const fetchNotificationCounter = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotificationCount(0);
        return;
      }
      const response = await axios.get(`${API_URL}/notification-counter`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setNotificationCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch notification count', {
        position: 'top-right',
        duration: 1000,
        style: {
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 700,
        },
      });
      setNotificationCount(0);
    }
  }, []);

  return (
    <CartContext.Provider value={{ NotificationCount, fetchNotificationCounter }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;