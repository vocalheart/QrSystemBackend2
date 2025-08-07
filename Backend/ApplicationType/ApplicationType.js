const express = require('express');
const router = express.Router();
const database = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Apply helmet middleware
router.use(helmet());

// GET: Fetch all application types by user_id
router.get('/applicationtype', authenticateToken, async (req, res) => {
  try {
    const sql = `SELECT name, id, user_id FROM ApplicationType WHERE user_id = ?`;
    const user_id = req.user.id;
    const [result] = await database.query(sql, [user_id]);

    res.status(200).json({
      message: "Successfully fetched application types",
      result
    });
  } catch (error) {
    console.error('Error fetching application types:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST: Add new application type
router.post(
  '/applicationtype',
  authenticateToken,
  body('name').trim().notEmpty().withMessage('Name is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    const user_id = req.user.id;

    try {
      // Prevent duplicate names
      const checkSql = `SELECT id FROM ApplicationType WHERE name = ? AND user_id = ?`;
      const [existing] = await database.query(checkSql, [name, user_id]);

      if (existing.length > 0) {
        return res.status(400).json({ message: "Application type already exists" });
      }

      const sql = `INSERT INTO ApplicationType (name, user_id) VALUES (?, ?)`;
      const [result] = await database.query(sql, [name, user_id]);

      res.status(200).json({ message: "Application type added successfully", result });
    } catch (error) {
      console.error('Insert error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE: Remove an application type
router.delete('/applicationtype/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const sql = `DELETE FROM ApplicationType WHERE id = ? AND user_id = ?`;
    const [result] = await database.query(sql, [id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found or unauthorized" });
    }

    res.status(200).json({ message: "Successfully deleted", result });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT: Update application type name
router.put(
  '/applicationtype/:id',
  authenticateToken,
  body('name').trim().notEmpty().withMessage('Name is required'),
  async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;
    const { name } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const sql = `UPDATE ApplicationType SET name = ? WHERE id = ? AND user_id = ?`;
      const [result] = await database.query(sql, [name, id, user_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "No matching record found or unauthorized" });
      }

      res.status(200).json({ message: "Application type has been updated", result });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;