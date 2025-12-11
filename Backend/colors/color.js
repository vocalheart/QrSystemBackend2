const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/AuthenticationToken');
const database = require('../database/mysql');

// GET All Colors From DB
router.get('/colors/options', AuthMiddleware, async (req, res) => {
    try {
        const sql = "SELECT * FROM colors";
        const [color] =  await database.query(sql)
         return res.status(200).json({message: "Succesfulll get" , color})
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error" });
    }
});

router.get('/formDetials/color/:id', AuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const colorId = Number(req.params.id);
    if (![1, 2, 3].includes(colorId)) {return res.status(400).json({ message: "Invalid color ID (only 1, 2, 3 allowed)" })};
    const [rows] = await database.query("SELECT * FROM form_submissions WHERE color_id = ? AND user_id = ? ORDER BY created_at DESC",[colorId, userId]);
    return res.status(200).json({success: true, color_id: colorId, total: rows.length, data: rows});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong in this code, please check" });
  }
});
module.exports = router;
