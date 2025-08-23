
const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/AuthenticationToken');
const database = require('../database/mysql');

// Utility to get correct user_id for members/admins
const getUserIdToUse = async (req, res) => {
  try {
    if (!req.user?.id) {
      res.status(403).json({ success: false, message: 'Invalid or missing user ID in token' });
      return null;
    }
    if (req.user.role === 'member') {
      const [rows] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!rows.length || !rows[0].created_by) {
        res.status(403).json({ success: false, message: 'No associated admin found for this member' });
        return null;
      }
      return rows[0].created_by;
    }
    return req.user.id;
  } catch (error) {
    console.error('Error in getUserIdToUse:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to retrieve user ID' });
    return null;
  }
};

// 1. Notification Counter (Unread Only)
router.get('/notification-counter', authenticateToken, async (req, res) => {
  try {
    const user_id = await getUserIdToUse(req, res);
    if (!user_id) return;

    const query = `SELECT COUNT(*) AS count FROM Notification WHERE user_id = ? AND status = 'unread'`;
    const [result] = await database.query(query, [user_id]);

    res.status(200).json({
      success: true,
      message: 'Successfully fetched unread notifications count',
      count: Number(result[0].count) || 0,
    });
  } catch (error) {
    console.error('Error fetching notification count:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification count',
    });
  }
});

// 2. Get All Notifications with Pagination
router.get(
  '/getNotifications',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be between 1 and 50'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const offset = (page - 1) * limit;

    try {
      const user_id = await getUserIdToUse(req, res);
      if (!user_id) return;

      const query = `
        SELECT id, type, message, status, 
               COALESCE(created_at, NOW()) AS created_at
        FROM Notification 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      const [notifications] = await database.query(query, [user_id, Number(limit), Number(offset)]);

      // Ensure created_at is in ISO 8601 format
      const formattedNotifications = notifications.map((notification) => ({
        ...notification,
        created_at: notification.created_at
          ? new Date(notification.created_at).toISOString()
          : new Date().toISOString(),
      }));

      const countQuery = `SELECT COUNT(*) AS total FROM Notification WHERE user_id = ?`;
      const [[{ total }]] = await database.query(countQuery, [user_id]);

      res.status(200).json({
        success: true,
        message: 'Successfully fetched notifications',
        notifications: formattedNotifications,
        total: Number(total) || 0,
        page,
        limit,
        hasMore: offset + notifications.length < total,
      });
    } catch (error) {
      console.error('Error fetching notifications:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Failed to load notifications',
      });
    }
  }
);

// 3. Update Status of Single Notification
router.post(
  '/notification/status/:id',
  authenticateToken,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid notification ID'),
    body('status').isIn(['read', 'unread']).withMessage('Status must be either "read" or "unread"'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const id = req.params.id;
    const { status } = req.body;

    try {
      const user_id = await getUserIdToUse(req, res);
      if (!user_id) return;

      const checkQuery = `SELECT id FROM Notification WHERE id = ? AND user_id = ?`;
      const [existing] = await database.query(checkQuery, [id, user_id]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found or unauthorized',
        });
      }

      const updateQuery = `UPDATE Notification SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`;
      const [result] = await database.query(updateQuery, [status, id, user_id]);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update notification status',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification status updated successfully',
      });
    } catch (error) {
      console.error('Error updating notification status:', { error: error.message, stack: error.stack });
      res.status(500).json({
        success: false,
        message: 'Failed to update notification status',
      });
    }
  }
);

// 4. Mark All Notifications as Read
router.put('/notification-mark-read', authenticateToken, async (req, res) => {
  try {
    const user_id = await getUserIdToUse(req, res);
    if (!user_id) return;

    const query = `UPDATE Notification SET status = 'read', updated_at = NOW() WHERE user_id = ? AND status = 'unread'`;
    const [result] = await database.query(query, [user_id]);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error('Error marking notifications as read:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
    });
  }
});

module.exports = router;
