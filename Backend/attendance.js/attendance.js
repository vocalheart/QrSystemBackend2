const express = require('express') ;
const pool = require('../database/mysql.js')
const router = express.Router();
const authenticateToken = require('../middleware/AuthenticationToken.js')
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    if (!['Admin', 'SuperAdmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    const [employee] = await pool.query('SELECT id FROM users WHERE id = ? AND role = ?', [user_id, 'Employee']);
    if (!employee[0]){
      return res.status(404).json({ message: 'Employee not found' });
    }
    const [result] = await pool.query(
      'INSERT INTO attendance (user_id) VALUES (?)',
      [user_id]
    );
    res.status(201).json({
      message: 'Attendance marked successfully',
      data: { id: result.insertId, user_id, created_at: new Date() },
    });
  } catch (error) {
    console.error('Attendance Save Error:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['Admin', 'SuperAdmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized action' });
    }
    const [attendances] = await pool.query(
      'SELECT a.id, a.user_id, a.created_at, u.name AS user_name FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC'
    );
    res.status(200).json({
      message: 'Attendance records fetched successfully',
      data: attendances,
    });
  } catch (error) {
    console.error('Attendance Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

module.exports= router;