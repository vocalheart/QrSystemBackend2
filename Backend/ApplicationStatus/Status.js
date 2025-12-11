const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const database = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');

// Validate required Backblaze B2 environment variables
const requiredEnvVars = ['B2_ENDPOINT', 'B2_KEY_ID', 'B2_KEY', 'B2_BUCKET_NAME', 'DASHBOARD_URL'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing Backblaze B2 environment variables:', missingEnvVars);
  throw new Error('Backblaze B2 configuration is incomplete');
}

// -----------------------------------------------------------------------------------------
// POST /status
// Creates a new status for visitor submission data, used in the frontend (status.jsx).
// Requires authentication and validates the status name.
// Inserts a notification for the created status.
// -----------------------------------------------------------------------------------------

router.post(
  '/status',
  authenticateToken,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Status name is required')
      .isLength({ max: 100 })
      .withMessage('Status name must not exceed 100 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const user_id = req.user.id;
    const { name } = req.body;

    try {
      // Check if the status name already exists for the user
      const [existingStatus] = await database.query(
        'SELECT id FROM status WHERE name = ? AND user_id = ?',
        [name, user_id]
      );
      if (existingStatus.length > 0) {
        return res.status(400).json({ message: 'Status name already exists' });
      }
      const sql = `INSERT INTO status (user_id, name, created_at) VALUES (?, ?, NOW())`;
      const [result] = await database.query(sql, [user_id, name]);
      const type = 'Status';
      const notiMessage = `New status "${name}" added`;
      const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
      await database.query(insertNotification, [user_id, type, notiMessage]);

      res.status(201).json({
        success: true,
        message: 'Status and notification added successfully',
        statusId: result.insertId,
      });
    } catch (error) {
      console.error('Error inserting status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to insert status',
      });
    }
  }
);

// -----------------------------------------------------------------------------------------
// GET /status
// Retrieves all statuses created by the authenticated user for visitor submission data.
// Used in the frontend (status.jsx).
// -----------------------------------------------------------------------------------------

router.get('/status', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const sql = 'SELECT id, name, user_id, created_at FROM status WHERE user_id = ?';
    const [results] = await database.query(sql, [userId]);
    res.status(200).json({ message: 'Successfully fetched', results });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// -----------------------------------------------------------------------------------------
// PUT /status/:id
// Updates an existing status for visitor submission data, used in the frontend (status.jsx).
// Requires authentication, validates the status name, and ensures the new name is unique.
// Inserts a notification for the updated status.
// -----------------------------------------------------------------------------------------

router.put('/status/:id',authenticateToken,[
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Status name is required')
      .isLength({ max: 100 })
      .withMessage('Status name must not exceed 100 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    try {
      // Check if the new status name already exists for the user (excluding the current status)
      const [existingStatus] = await database.query(
        'SELECT id FROM status WHERE name = ? AND user_id = ? AND id != ?',
        [name, userId, id]
      );
      if (existingStatus.length > 0) {
        return res.status(400).json({ message: 'Status name already exists' });
      }

      const sql = `UPDATE status SET name = ?, created_at = NOW() WHERE id = ? AND user_id = ?`;
      const [result] = await database.query(sql, [name, id, userId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Status not found or unauthorized' });
      }

      const type = 'Status';
      const notiMessage = `Status ID ${id} updated to "${name}"`;
      const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
      await database.query(insertNotification, [userId, type, notiMessage]);

      res.status(200).json({
        message: 'Updated Successfully',
        updatedId: id,
        updatedName: name,
      });
    } catch (err) {
      console.error('MySQL Error:', err);
      res.status(500).json({ message: 'Database error' });
    }
  }
);

// -----------------------------------------------------------------------------------------
// DELETE /status/:id
// Deletes a status created by the authenticated user, used in the frontend (status.jsx).
// Ensures the status is not used in form submissions before deletion.
// Inserts a notification for the deleted status.
// -----------------------------------------------------------------------------------------

router.delete('/status/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    // Check if the status is used in form_submissions
    const [submissions] = await database.query(
      'SELECT id FROM form_submissions WHERE status = (SELECT name FROM status WHERE id = ? AND user_id = ?)',
      [id, userId]
    );
    if (submissions.length > 0) {
      return res.status(400).json({ message: 'Cannot delete status; it is used in form submissions' });
    }

    const sql = 'DELETE FROM status WHERE id = ? AND user_id = ?';
    const [result] = await database.query(sql, [id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Status not found or unauthorized' });
    }
    const type = 'Status';
    const notiMessage = `Status ID ${id} deleted`;
    const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
    await database.query(insertNotification, [userId, type, notiMessage]);

    res.status(200).json({ message: 'Status deleted successfully' });
  } catch (error) {
    console.error('Error deleting status:', error);
    res.status(500).json({ message: 'Error deleting status' });
  }
});

module.exports = router;