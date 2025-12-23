import React, { createContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export const NotificationMessageContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const LIMIT = 10; // Increased for better UX

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to view notifications', { position: 'top-right', duration: 3000 });
      setError('No authentication token found');
      return;
    };
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/getNotifications?page=${pageNum}&limit=${LIMIT}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { notifications: newNotifs, total, hasMore: more } = response.data;
      setNotifications((prev) => (append ? [...prev, ...newNotifs] : newNotifs));
      setTotal(total);
      setHasMore(more);
      setPage(pageNum);
    } catch (err){
      console.error('Fetch notifications error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch notifications';
      toast.error(errorMsg, { position: 'top-right', duration: 3000 });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Update status of a single notification
  const updateNotificationStatus = useCallback(async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Login required', { position: 'top-right', duration: 3000 });
      return;
    }
   try {
      await axios.post(
        `${API_URL}/notification/status/${id}`,
        { status: 'read' },
        { 
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, status: 'read' } : notif))
      );
      toast.success('Notification marked as read', { position: 'top-right', duration: 2000 });
    } catch (err) {
      console.error('Update notification error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update status';
      toast.error(errorMsg, { position: 'top-right', duration: 3000 });
    }
  }, [API_URL]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Login required', { position: 'top-right', duration: 3000 });
      return;
    }
    try {
      await axios.put(`${API_URL}/notification-mark-read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Optimistically update
      setNotifications((prev) => prev.map((notif) => ({ ...notif, status: 'read' })));
      toast.success('All notifications marked as read', { position: 'top-right', duration: 2000 });
    } catch (err) {
      console.error('Mark all read error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to mark all as read';
      toast.error(errorMsg, { position: 'top-right', duration: 3000 });
    }
  }, [API_URL]);

  // Delete a single notification
  const deleteNotification = useCallback(async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Login required', { position: 'top-right', duration: 3000 });
      return;
    }
    try {
      await axios.delete(`${API_URL}/notification/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Optimistically remove from state
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success('Notification deleted', { position: 'top-right', duration: 2000 });
    } catch (err) {
      console.error('Delete notification error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete notification';
      toast.error(errorMsg, { position: 'top-right', duration: 3000 });
    }
  }, [API_URL]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Login required', { position: 'top-right', duration: 3000 });
      return;
    }
    try {
      await axios.delete(`${API_URL}/notification-delete-all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Clear state
      setNotifications([]);
      setTotal(0);
      setHasMore(false);
      setPage(1);
      toast.success('All notifications deleted', { position: 'top-right', duration: 2000 });
    } catch (err) {
      console.error('Delete all notifications error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete all notifications';
      toast.error(errorMsg, { position: 'top-right', duration: 3000 });
    }
  }, [API_URL]);

  // Load more notifications
  const loadMoreNotifications = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    fetchNotifications(nextPage, true);
  }, [loading, hasMore, page, fetchNotifications]);

  // Initial fetch on mount if needed, but typically called from component
  useEffect(() => {
    // Don't auto-fetch here; let components trigger it
  }, []);

  return (
    <NotificationMessageContext.Provider
      value={{
        notifications,
        error,
        total,
        hasMore,
        loading,
        fetchNotifications,
        updateNotificationStatus,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        loadMoreNotifications,
      }}
    >
      {children}
    </NotificationMessageContext.Provider>
  );
};

export default NotificationProvider;