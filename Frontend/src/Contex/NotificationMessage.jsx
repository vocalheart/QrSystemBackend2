import React, { createContext, useState } from 'react';
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

  const API_URL = import.meta.env.VITE_API_URL
  const LIMIT = 5;

  // Fetch notifications with pagination
  const fetchNotifications = async (pageNum = 1, append = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to view notifications');
      setError('No authentication token found');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/getNotifications?page=${pageNum}&limit=${LIMIT}`,
        { headers: {
            Authorization: `Bearer ${token}`,
          },});

      const { notifications: newNotifs, total, hasMore } = response.data;

      setNotifications((prev) => (append ? [...prev, ...newNotifs] : newNotifs));
      setTotal(total);
      setHasMore(hasMore);
      setError(null);
    } catch (err) {
      console.error('Fetch notifications error:', err);
      toast.error(err.response?.data?.error || 'Failed to fetch notifications');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update status of a single notification
  const updateNotificationStatus = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Login required');
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

      toast.success('Notification marked as read');
      fetchNotifications(1); // Refresh
      setPage(1);
    } catch (err) {
      console.error('Update notification error:', err);
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Login required');
      return;
    }

    try {
      await axios.put(`${API_URL}/notification-mark-read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('All notifications marked as read');
      fetchNotifications(1); // Refresh
      setPage(1);
    } catch (err) {
      console.error('Mark all read error:', err);
      toast.error(err.response?.data?.error || 'Failed to mark all as read');
    }
  };

  // Load more notifications
  const loadMoreNotifications = () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    fetchNotifications(nextPage, true);
    setPage(nextPage);
  };

  return (
    <NotificationMessageContext.Provider
      value={{ notifications,error,total,hasMore,loading,fetchNotifications,updateNotificationStatus,markAllAsRead,loadMoreNotifications,
      }}
    >
      {children}
    </NotificationMessageContext.Provider>
  );
};
