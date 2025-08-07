const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/AuthenticationToken');
const database = require('../database/mysql');

// GET: /submission/counter
router.get('/submission/counter', authenticateToken, async (req, res) => {
  try {
    let userIdToUse;
    if (req.user.role === 'member') {
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ success: false, message: 'No associated admin found for this member' });
      }
      userIdToUse = user[0].created_by;
    } else {
      userIdToUse = req.user.id;
    }
    const [rows] = await database.query(
      'SELECT COUNT(*) AS total FROM form_submissions WHERE user_id = ?',
      [userIdToUse]
    );
    res.json({ success: true, total: rows[0].total || 0 });
  } catch (error) {
    console.error('Submission count error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET: /submission/list
router.get('/submission/list', authenticateToken, async (req, res) => {
  try {
    let userIdToUse;

    if (req.user.role === 'member') {
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ success: false, message: 'No associated admin found for this member' });
      }
      userIdToUse = user[0].created_by;
    } else {
      userIdToUse = req.user.id;
    }

    const [rows] = await database.query(
      'SELECT id, status, created_at, user_id AS userId FROM form_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userIdToUse]
    );

    res.json({ success: true, submissions: rows });
  } catch (error) {
    console.error('Recent submissions error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
