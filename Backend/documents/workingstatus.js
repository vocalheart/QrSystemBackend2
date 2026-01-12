const express = require('express');
const router = express.Router();
const db = require('../database/mysql');
const authMiddleware = require('../middleware/AuthenticationToken');

router.put('/working-status/:id', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { working_status } = req.body;
  const { id } = req.params;
    console.log({ userId, working_status, id }); // 🔥 DEBUG


  const allowedStatus = ['WORKING', 'LEFT', 'BLACKLIST'];

  if (!working_status || !allowedStatus.includes(working_status)) {
    return res.status(400).json({success: false,message: 'Invalid working status'});
  }
  try {
    const sql = `UPDATE form_submissions SET working_status = ? WHERE user_id = ? AND id = ?`;
    const [result] = await db.execute(sql, [working_status, userId, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({success: false,message: 'Record not found or unauthorized'});
    }
    res.status(200).json({success: true,message: 'Working status updated successfully',working_status});
  } catch (error) {console.error(error);
    res.status(500).json({
    success: false,
    message: 'Something went wrong'
    });
  }
});

module.exports = router;
