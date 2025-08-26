const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const database = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');

// -----------------------------------------------------------------------------------------
// POST /department
// Creates a new department for the authenticated user.
// Used in the frontend (Department.jsx) to add a department.
// Validates the department name and inserts a notification upon creation.
// -----------------------------------------------------------------------------------------

router.post(
  '/department',
  authenticateToken,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Department name is required')
      .isLength({ max: 100 })
      .withMessage('Department name must not exceed 100 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const user_id = req.user.id;
    const { name } = req.body;

    try {
      const sql = `INSERT INTO department (user_id, name) VALUES (?, ?)`;
      const [result] = await database.query(sql, [user_id, name]);

      const type = 'Department';
      const notiMessage = `New department "${name}" added`;
      const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
      await database.query(insertNotification, [user_id, type, notiMessage]);

      res.status(201).json({
        success: true,
        message: 'Department and notification added successfully',
        departmentId: result.insertId,
      });
    } catch (error) {
      console.error('Error inserting department:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to insert department',
      });
    }
  }
);

// -----------------------------------------------------------------------------------------
// GET /department
// Retrieves all departments created by the authenticated user.
// Used in the frontend (Department.jsx) to display department data.
// -----------------------------------------------------------------------------------------

router.get('/department', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const sql = 'SELECT id, name, user_id FROM department WHERE user_id = ?';
    const [results] = await database.query(sql, [userId]);
    res.status(200).json({ message: 'Successfully fetched', results });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to get department' });
  }
});

// -----------------------------------------------------------------------------------------
// DELETE /department/:id
// Deletes a department by ID for the authenticated user.
// Used in the frontend (Department.jsx) to remove a department.
// Ensures the department exists and belongs to the user before deletion.
// -----------------------------------------------------------------------------------------

router.delete('/department/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const sql = 'DELETE FROM department WHERE id = ? AND user_id = ?';
    const [result] = await database.query(sql, [id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found or unauthorized' });
    }
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Error deleting department' });
  }
});

// -----------------------------------------------------------------------------------------
// PUT /department/:id
// Updates the name of an existing department for the authenticated user.
// Used in the frontend (Department.jsx) to modify department details.
// Validates the new name and ensures the department exists and belongs to the user.
// -----------------------------------------------------------------------------------------

router.put(
  '/department/:id',
  authenticateToken,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Department name is required')
      .isLength({ max: 100 })
      .withMessage('Department name must not exceed 100 characters'),
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
      const sql = `UPDATE department SET name = ? WHERE id = ? AND user_id = ?`;
      const [result] = await database.query(sql, [name, id, userId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Department not found or unauthorized' });
      }
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

module.exports = router;