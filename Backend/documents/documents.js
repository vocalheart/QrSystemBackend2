require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const db = require("../database/mysql");
const router = express.Router();
const authenticateToken = require("../middleware/AuthenticationToken");

// AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer Config - Removed strict limit of 4 files
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB per file
    fieldSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|jpg|jpeg|png/i;
    const ext = allowed.test(path.extname(file.originalname));
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF, DOC, JPG, PNG allowed"));
  },
});

// =================================================================
// UPLOAD MULTIPLE DOCUMENTS - NOW FLEXIBLE (1 to 4 files allowed)
// =================================================================
router.post(
  "/upload-multiple",
  authenticateToken,
  (req, res, next) => {
    req.setTimeout(900000);
    res.setTimeout(900000);
    req.socket.setTimeout(900000);
    req.socket.setNoDelay(true);
    next();
  },
  upload.array("documents"), // No fixed limit - accepts any number
  async (req, res) => {
    let connection = null;

    try {
      const userId = req.user.id;
      const { form_submission_id } = req.body;

      let documentTypes = [];
      if (req.body.document_types) {
        try {
          documentTypes = JSON.parse(req.body.document_types);
        } catch (e) {
          return res.status(400).json({ error: "Invalid document_types format" });
        }
      }

      // All Extra Fields - Optional
      const extraFields = {
        bank_account_number: req.body.bank_account_number?.trim() || null,
        ifsc_code: req.body.ifsc_code?.trim() || null,
        applicant_name: req.body.applicant_name?.trim() || null,
        applicant_email: req.body.applicant_email?.trim() || null,
        emergency_contact_number: req.body.emergency_contact_number?.trim() || null,
        emergency_contact_name: req.body.emergency_contact_name?.trim() || null,
        emergency_relation: req.body.emergency_relation?.trim() || null,
        emergency_address: req.body.emergency_address?.trim() || null,
        date_of_birth: req.body.date_of_birth?.trim() || null,
        date_of_joining: req.body.date_of_joining?.trim() || null,
      };

      // Validation
      if (!form_submission_id) {
        return res.status(400).json({ error: "form_submission_id required" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one document is required" });
      }

      if (!Array.isArray(documentTypes) || documentTypes.length !== req.files.length) {
        return res.status(400).json({ error: "document_types must match the number of uploaded files" });
      }

      const allowedTypes = ["aadhaar", "pan", "driving_license", "bank_passbook"];
      const typeSet = new Set();

      for (const type of documentTypes) {
        if (!allowedTypes.includes(type)) {
          return res.status(400).json({ error: `Invalid document type: ${type}` });
        }
        if (typeSet.has(type)) {
          return res.status(400).json({ error: `Duplicate document type: ${type}` });
        }
        typeSet.add(type);
      }

      // Optional: Allow duplicates if you want, just remove the duplicate check above

      connection = await db.getConnection();
      await connection.beginTransaction();

      const uploaded = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const type = documentTypes[i];
        const ext = path.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const fileName = `uploads/${type}-${timestamp}-${randomStr}${ext}`;

        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

        const [result] = await connection.query(
          `INSERT INTO documents 
          (file_name, file_url, user_id, form_submission_id, document_type,
           bank_account_number, ifsc_code, applicant_name, applicant_email,
           emergency_contact_number, emergency_contact_name, emergency_relation, emergency_address,
           date_of_birth, date_of_joining, uploaded_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            fileName,
            fileUrl,
            userId,
            form_submission_id,
            type,
            extraFields.bank_account_number,
            extraFields.ifsc_code,
            extraFields.applicant_name,
            extraFields.applicant_email,
            extraFields.emergency_contact_number,
            extraFields.emergency_contact_name,
            extraFields.emergency_relation,
            extraFields.emergency_address,
            extraFields.date_of_birth,
            extraFields.date_of_joining,
          ]
        );

        uploaded.push({
          id: result.insertId,
          document_type: type,
          file_name: fileName,
          file_url: fileUrl,
        });
      }

      await connection.commit();

      res.json({
        success: true,
        message: `${req.files.length} document(s) uploaded successfully!`,
        documents: uploaded,
      });
    } catch (err) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackErr) {
          console.error("Rollback failed:", rollbackErr);
        }
      }

      console.error("Upload error:", err);

      if (err.message.includes("Invalid file type")) {
        return res.status(400).json({ error: err.message });
      }

      if (err.code === "ECONNRESET" || err.code === "ERR_STREAM_PREMATURE_CLOSE") {
        return res.status(504).json({ error: "Upload interrupted. Please try again." });
      }

      res.status(500).json({ error: "Upload failed. Please try again later." });
    } finally {
      if (connection) connection.release();
    }
  }
);

// =================================================================
// UPDATE SINGLE DOCUMENT FILE (unchanged)
// =================================================================
router.put(
  "/documents/:id",
  authenticateToken,
  (req, res, next) => {
    req.setTimeout(300000);
    res.setTimeout(300000);
    next();
  },
  upload.single("document"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const docId = req.params.id;

      if (!req.file) {
        return res.status(400).json({ error: "New file is required" });
      }

      const [rows] = await db.query(
        "SELECT * FROM documents WHERE id = ? AND user_id = ?",
        [docId, userId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Document not found" });
      }

      const oldDoc = rows[0];
      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileName = `uploads/${oldDoc.document_type}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      // Delete old file from S3
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: oldDoc.file_name,
          })
        );
      } catch (e) {
        console.error("Failed to delete old file:", e);
      }

      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

      await db.query(
        `UPDATE documents SET file_name = ?, file_url = ?, updated_at = NOW() WHERE id = ?`,
        [fileName, fileUrl, docId]
      );

      res.json({ success: true, message: "Document updated successfully" });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ error: "Update failed" });
    }
  }
);

// =================================================================
// UPDATE EXTRA FIELDS ONLY - USING DOCUMENT ID
// =================================================================
router.put("/documents/update-extra/:docId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const docId = req.params.docId;

    const {
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
    } = req.body;

    // At least one field should be provided
    if (
      !bank_account_number && !ifsc_code && !applicant_name && !applicant_email &&
      !emergency_contact_number && !emergency_contact_name && !emergency_relation &&
      !emergency_address && !date_of_birth && !date_of_joining
    ) {
      return res.status(400).json({ error: "At least one field is required to update" });
    }

    const [result] = await db.query(
      `UPDATE documents SET 
       bank_account_number = ?,
       ifsc_code = ?,
       applicant_name = ?,
       applicant_email = ?,
       emergency_contact_number = ?,
       emergency_contact_name = ?,
       emergency_relation = ?,
       emergency_address = ?,
       date_of_birth = ?,
       date_of_joining = ?,
       updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [
        bank_account_number?.trim() || null,
        ifsc_code?.trim() || null,
        applicant_name?.trim() || null,
        applicant_email?.trim() || null,
        emergency_contact_number?.trim() || null,
        emergency_contact_name?.trim() || null,
        emergency_relation?.trim() || null,
        emergency_address?.trim() || null,
        date_of_birth?.trim() || null,
        date_of_joining?.trim() || null,
        docId,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Document not found or access denied" });
    }

    res.json({ success: true, message: "Additional information updated successfully" });
  } catch (err) {
    console.error("Update extra error:", err);
    res.status(500).json({ error: "Failed to update additional information" });
  }
});

// =================================================================
// GET FORMS WITH DOCUMENTS
// =================================================================
router.get("/form", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Main query (with LIMIT & OFFSET)
    const sql = `
      SELECT 
        fs.id AS form_id,
        fs.qr_code_id,
        fs.user_id,
        fs.name,
        fs.email,
        fs.number,
        fs.created_at,
        fs.resume,
        fs.reason,
        fs.application_type,
        fs.status,
        fs.reviewed,
        fs.designation,
        fs.department_name,
        fs.resume_url,
        fs.updated_at,
        fs.comments,
        fs.color_id,

        d.id AS document_id,
        d.file_name,
        d.file_url,
        d.uploaded_at,
        d.document_type,
        d.bank_account_number,
        d.ifsc_code,
        d.applicant_name,
        d.applicant_email,
        d.emergency_contact_number,
        d.emergency_contact_name,
        d.emergency_relation,
        d.emergency_address,
        d.date_of_birth,
        d.date_of_joining
      FROM form_submissions fs
      LEFT JOIN documents d ON fs.id = d.form_submission_id
      WHERE fs.user_id = ? AND fs.color_id = 1
      ORDER BY fs.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(sql, [userId, limit, offset]);

    // Total count (for frontend pagination)
    const countSql = `
      SELECT COUNT(*) as total
      FROM form_submissions
      WHERE user_id = ? AND color_id = 1
    `;
    const [[countResult]] = await db.query(countSql, [userId]);
    const totalRecords = countResult.total;
    const totalPages = Math.ceil(totalRecords / limit);

    if (!rows.length) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          totalRecords,
          totalPages,
        },
      });
    }

    // Grouping forms with documents
    const formsMap = new Map();

    rows.forEach((row) => {
      if (!formsMap.has(row.form_id)) {
        formsMap.set(row.form_id, {
          id: row.form_id,
          qr_code_id: row.qr_code_id,
          user_id: row.user_id,
          name: row.name,
          email: row.email,
          number: row.number,
          created_at: row.created_at,
          resume: row.resume,
          reason: row.reason,
          application_type: row.application_type,
          status: row.status,
          reviewed: row.reviewed,
          designation: row.designation,
          department_name: row.department_name,
          resume_url: row.resume_url,
          updated_at: row.updated_at,
          comments: row.comments,
          color_id: row.color_id,
          documents: [],
        });
      }

      if (row.document_id) {
        formsMap.get(row.form_id).documents.push({
          id: row.document_id,
          file_name: row.file_name,
          file_url: row.file_url,
          uploaded_at: row.uploaded_at,
          document_type: row.document_type,
          bank_account_number: row.bank_account_number,
          ifsc_code: row.ifsc_code,
          applicant_name: row.applicant_name,
          applicant_email: row.applicant_email,
          emergency_contact_number: row.emergency_contact_number,
          emergency_contact_name: row.emergency_contact_name,
          emergency_relation: row.emergency_relation,
          emergency_address: row.emergency_address,
          date_of_birth: row.date_of_birth,
          date_of_joining: row.date_of_joining,
        });
      }
    });

    res.json({
      success: true,
      data: Array.from(formsMap.values()),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to load forms" });
  }
});


module.exports = router;