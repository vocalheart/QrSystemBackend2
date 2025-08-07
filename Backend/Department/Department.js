const express = require('express');
const router = express.Router();
const pool = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken')
const { body, validationResult } = require('express-validator');


router.post('/department', authenticateToken,
  [ body('name').trim().notEmpty().withMessage('Department name is required').isLength({ max: 100 })
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
      // Insert into department table
      const sql = `INSERT INTO department (user_id, name) VALUES (?, ?)`;
      const [result] = await pool.query(sql, [user_id, name]);

      // Insert into notification table
      const type = 'Department';
      const notiMessage = `New department "${name}" added `;   // by user ID ${user_id}
      const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
      await pool.query(insertNotification, [user_id, type, notiMessage]);

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

// get all department
router.get('/department', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const sql = 'SELECT id, name, user_id FROM department WHERE user_id = ?';
    const [results] = await pool.query(sql, [userId]);
    res.status(200).json({ message: 'Successfully fetched', results });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to get department' });
  }
});

// delete department
router.delete('/department/:id',authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const sql = 'DELETE FROM department WHERE id = ? AND user_id = ?';
    const [result] = await pool.query(sql, [id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found or unauthorized' });
    }
    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Error deleting department' });
  }
});


// update department
router.put('/department/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const sql = `UPDATE department SET name = ? WHERE id = ?`;
    const [result] = await pool.query(sql, [name, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.status(200).json({
      message: 'Updated Successfully',
      updatedId: id,
      updatedName: name
    });
  } catch (err) {
    console.error('MySQL Error:', err);
    res.status(500).json({ message: 'Database error' });
  }
});



module.exports = router;
