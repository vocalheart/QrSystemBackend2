const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const database = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');

// -----------------------------------------------------------------------------------------
// Validate required Backblaze B2 environment variables
// Ensures all necessary environment variables are set before processing requests.
// -----------------------------------------------------------------------------------------

const requiredEnvVars = ['B2_ENDPOINT', 'B2_KEY_ID', 'B2_KEY', 'B2_BUCKET_NAME', 'DASHBOARD_URL'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing Backblaze B2 environment variables:', missingEnvVars);
  throw new Error('Backblaze B2 configuration is incomplete');
}

// -----------------------------------------------------------------------------------------
// POST /designation
// Creates a new designation for the authenticated user.
// Used in the frontend (designation.jsx) to add a designation.
// Validates the designation name, checks for duplicates, and inserts a notification.
// -----------------------------------------------------------------------------------------

router.post(
  '/designation',
  authenticateToken,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Designation name is required')
      .isLength({ max: 100 })
      .withMessage('Designation name must not exceed 100 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const user_id = req.user.id;
    const { name } = req.body;

    try {
      // Check if designation name already exists for the user
      const [existingDesignation] = await database.query(
        'SELECT id FROM designation WHERE name = ? AND user_id = ?',
        [name, user_id]
      );
      if (existingDesignation.length > 0) {
        return res.status(400).json({ message: 'Designation name already exists' });
      }

      const sql = `INSERT INTO designation (user_id, name, created_at) VALUES (?, ?, NOW())`;
      const [result] = await database.query(sql, [user_id, name]);

      const type = 'Designation';
      const notiMessage = `New designation "${name}" added`;
      const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
      await database.query(insertNotification, [user_id, type, notiMessage]);

      res.status(201).json({
        success: true,
        message: 'Designation and notification added successfully',
        result: result.insertId, // Matches designation.jsx expectation
      });
    } catch (error) {
      console.error('Error inserting designation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to insert designation',
      });
    }
  }
);

// -----------------------------------------------------------------------------------------
// GET /designation
// Retrieves all designations created by the authenticated user.
// Used in the frontend (designation.jsx) to display designation data.
// -----------------------------------------------------------------------------------------

router.get('/designation', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const sql = 'SELECT id, name, user_id, created_at FROM designation WHERE user_id = ?';
    const [results] = await database.query(sql, [userId]);
    res.status(200).json({ message: 'Successfully fetched', result: results }); // Matches designation.jsx expectation
  } catch (error) {
    console.error('Error fetching designations:', error);
    res.status(500).json({ error: 'Failed to get designation' });
  }
});

// -----------------------------------------------------------------------------------------
// PUT /designation/:id
// Updates the name of an existing designation for the authenticated user.
// Used in the frontend (designation.jsx) to modify designation details.
// Validates the new name, checks for duplicates, and inserts a notification.
// -----------------------------------------------------------------------------------------

router.put(
  '/designation/:id',
  authenticateToken,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Designation name is required')
      .isLength({ max: 100 })
      .withMessage('Designation name must not exceed 100 characters'),
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
      // Check if the new designation name already exists for the user (excluding the current designation)
      const [existingDesignation] = await database.query(
        'SELECT id FROM designation WHERE name = ? AND user_id = ? AND id != ?',
        [name, userId, id]
      );
      if (existingDesignation.length > 0) {
        return res.status(400).json({ message: 'Designation name already exists' });
      }

      const sql = `UPDATE designation SET name = ?, created_at = NOW() WHERE id = ? AND user_id = ?`;
      const [result] = await database.query(sql, [name, id, userId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Designation not found or unauthorized' });
      }

      const type = 'Designation';
      const notiMessage = `Designation ID ${id} updated to "${name}"`;
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
// DELETE /designation/:id
// Deletes a designation by ID for the authenticated user.
// Used in the frontend (designation.jsx) to remove a designation.
// Ensures the designation is not used in form submissions and belongs to the user.
// Inserts a notification upon deletion.
// -----------------------------------------------------------------------------------------

router.delete('/designation/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    // Check if the designation is used in form_submissions
    const [submissions] = await database.query(
      'SELECT id FROM form_submissions WHERE designation = (SELECT name FROM designation WHERE id = ? AND user_id = ?)',
      [id, userId]
    );
    if (submissions.length > 0) {
      return res.status(400).json({ message: 'Cannot delete designation; it is used in form submissions' });
    }

    const sql = 'DELETE FROM designation WHERE id = ? AND user_id = ?';
    const [result] = await database.query(sql, [id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Designation not found or unauthorized' });
    }

    const type = 'Designation';
    const notiMessage = `Designation ID ${id} deleted`;
    const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
    await database.query(insertNotification, [userId, type, notiMessage]);

    res.status(200).json({ message: 'Designation deleted successfully' });
  } catch (error) {
    console.error('Error deleting designation:', error);
    res.status(500).json({ message: 'Error deleting designation' });
  }
});

module.exports = router;