
const express = require('express')
const db = require("../database/mysql");
const router = express.Router();
const authenticateToken = require("../middleware/AuthenticationToken");

router.post("/documents/additional-info", authenticateToken, async (req, res) => {
    let connection;
    try {
      const userId = req.user.id;
      const {form_submission_id,bank_account_number,ifsc_code,
        applicant_name,
        applicant_email,
        emergency_contact_number,
        emergency_contact_name,
        emergency_relation,
        emergency_address,
        date_of_birth,
        date_of_joining,
      } = req.body;

      if (!form_submission_id) {
        return res.status(400).json({
          error: "form_submission_id is required",
        });
      }

      connection = await db.getConnection();
      await connection.beginTransaction();

      const [form] = await connection.query(
        `SELECT id FROM form_submissions 
         WHERE id = ? AND user_id = ?`,
        [form_submission_id, userId]
      );

      if (!form.length) {
        return res.status(404).json({
          error: "Invalid form_submission_id",
        });
      }

      const [existing] = await connection.query(
        `SELECT id FROM Additinoal_Document_Informetion
         WHERE user_id = ? AND form_submission_id = ?`,
        [userId, form_submission_id]
      );

      if (existing.length) {
        await connection.query(
          `UPDATE Additinoal_Document_Informetion SET
            bank_account_number = ?,
            ifsc_code = ?,
            applicant_name = ?,
            applicant_email = ?,
            emergency_contact_number = ?,
            emergency_contact_name = ?,
            emergency_relation = ?,
            emergency_address = ?,
            date_of_birth = ?,
            date_of_joining = ?
           WHERE id = ?`,
          [
            bank_account_number || null,
            ifsc_code || null,
            applicant_name || null,
            applicant_email || null,
            emergency_contact_number || null,
            emergency_contact_name || null,
            emergency_relation || null,
            emergency_address || null,
            date_of_birth || null,
            date_of_joining || null,
            existing[0].id,
          ]
        );

        await connection.commit();

        return res.json({
          success: true,
          action: "updated",
          form_submission_id,
        });
      } else {
        const [insert] = await connection.query(
          `INSERT INTO Additinoal_Document_Informetion (
            user_id,
            form_submission_id,
            bank_account_number,
            ifsc_code,
            applicant_name,
            applicant_email,
            emergency_contact_number,
            emergency_contact_name,
            emergency_relation,
            emergency_address,
            date_of_birth,
            date_of_joining
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            form_submission_id,
            bank_account_number || null,
            ifsc_code || null,
            applicant_name || null,
            applicant_email || null,
            emergency_contact_number || null,
            emergency_contact_name || null,
            emergency_relation || null,
            emergency_address || null,
            date_of_birth || null,
            date_of_joining || null,
          ]
        );

        await connection.commit();

        return res.json({
          success: true,
          action: "inserted",
          id: insert.insertId,
          form_submission_id,
        });
      }
    } catch (err) {
      if (connection) await connection.rollback();
      console.error("Additional info error:", err);
      res.status(500).json({
        error: "Failed to save additional information",
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


router.get(
  "/documents/additional-info/:form_submission_id",
  authenticateToken,
  async (req, res) => {
    let connection;
    try {
      const userId = req.user.id;
      const { form_submission_id } = req.params;

      connection = await db.getConnection();

      const [rows] = await connection.query(
        `SELECT 
          id,
          form_submission_id,
          bank_account_number,
          ifsc_code,
          applicant_name,
          applicant_email,
          emergency_contact_number,
          emergency_contact_name,
          emergency_relation,
          emergency_address,
          date_of_birth,
          date_of_joining,
          created_at
         FROM Additinoal_Document_Informetion
         WHERE user_id = ? AND form_submission_id = ?`,
        [userId, form_submission_id]
      );

      if (!rows.length) {
        return res.json({
          success: true,
          data: null,
          message: "No additional information found",
        });
      }

      res.json({
        success: true,
        data: rows[0],
      });
    } catch (err) {
      console.error("Get additional info error:", err);
      res.status(500).json({
        error: "Failed to fetch additional information",
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

module.exports = router;
