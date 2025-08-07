const express = require('express');
const router = express.Router();
const database = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');

// get designation for me
router.get('/designation', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `SELECT id , name FROM designation WHERE user_id = ?`;
    const [result] = await database.query(query, [userId]);
    res.status(200).json({ message: "Successful get", result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong in designation" });
  }
});

// post degignation
router.post('/designation', authenticateToken , async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id
    const sql = `INSERT INTO designation (user_id , name) VALUES (? , ?)`;
    const [results] = await database.query(sql, [userId, name]);
    const type = 'Designation';
      const notiMessage = `New designation "${name}" added `;   //by user ID ${user_id}
      const insertNotification = `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`;
      await database.query(insertNotification, [userId, type, notiMessage]);
    res.status(201).json({ message: "Successfully added", result: results.insertId });
  } catch (error) {
    console.error("Error inserting designation:", error);
    res.status(500).json({error: "Failed to add designation"});
  }
});

 // PUT /designation/:id
router.put('/designation/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: "Name is required" });
    }
    const sql = `UPDATE designation SET name = ? WHERE id = ? AND user_id = ?`;
    const [result] = await database.query(sql, [name, id, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Designation not found or not authorized" });
    }
    res.status(200).json({ message: "Successfully updated", result });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//  delete designation
 router.delete('/designation/:id', authenticateToken, async (req, res)=>{
    try{
        const {id} = req.params;
        const userId = req.user.id;
        const sql = `DELETE FROM designation WHERE id = ? AND user_id = ?`
        const [result] = await database.query(sql, [id , userId]);
         if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Designation not found or not authorized" });
    }
        res.status(201).json({message: "Successfully delete" , result})
    }catch(error){
        console.error("Error inserting designation:", error);
        res.status(500).json({error: "Failed to add designation"});
    }
 })

module.exports = router;
