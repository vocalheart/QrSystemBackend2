require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const db = require("../database/mysql");
const router = express.Router();
const authenticateToken = require("../middleware/AuthenticationToken");

// ---------------- AWS S3 CLIENT ----------------
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ---------------- MULTER ----------------
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|txt|jpg|jpeg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG allowed"));
  },
});

// =================================================================
// MULTIPLE FILE UPLOAD + EXTRA FIELDS (bank, ifsc, applicant info)
// =================================================================
router.post("/upload-multiple", authenticateToken, upload.array("documents", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const userId = req.user.id;
    const {
      form_submission_id,
      bank_account_number,
      ifsc_code,
      applicant_name,
      applicant_email
    } = req.body;

    if (!form_submission_id) {
      return res.status(400).json({ error: "form_submission_id is required" });
    }

    let uploadedFiles = [];

    for (let file of req.files) {
      const ext = path.extname(file.originalname);
      const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;

      // Upload to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

      // Insert into DB with extra fields
      const [result] = await db.query(
        `INSERT INTO documents 
         (file_name, file_url, user_id, form_submission_id, bank_account_number, ifsc_code, applicant_name, applicant_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fileName,
          fileUrl,
          userId,
          form_submission_id,
          bank_account_number || null,
          ifsc_code || null,
          applicant_name || null,
          applicant_email || null
        ]
      );

      uploadedFiles.push({
        fileId: result.insertId,
        fileName,
        fileUrl,
      });
    }

    res.json({ message: "Files uploaded successfully!", uploadedFiles });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/documents/create", upload.single("file"), async (req, res) => {
  try {
    const {
      user_id,
      form_submission_id,
      bank_account_number,
      ifsc_code,
      applicant_name,
      applicant_email
    } = req.body;

    const file_name = req.file.filename;

    const query = `
      INSERT INTO documents 
      (file_name, user_id, form_submission_id, bank_account_number, ifsc_code, applicant_name, applicant_email) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
      file_name,
      user_id,
      form_submission_id,
      bank_account_number,
      ifsc_code,
      applicant_name,
      applicant_email
    ]);

    res.json({ success: true, message: "Document uploaded successfully" });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =================================================================
// UPDATE DOCUMENT + EXTRA FIELDS
// =================================================================
router.put("/documents/:id", authenticateToken, upload.single("document"), async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;

    const { bank_account_number, ifsc_code, applicant_name, applicant_email } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "New file is required" });
    }

    // Fetch old document
    const [rows] = await db.query(
      "SELECT * FROM documents WHERE id = ? AND user_id = ?",
      [documentId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Document not found or unauthorized" });
    }

    const oldDoc = rows[0];

    // New file name
    const ext = path.extname(req.file.originalname);
    const newFileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Upload new file to S3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: newFileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const newFileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${newFileName}`;

    // Delete Old file
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: oldDoc.file_name,
    }));

    // Update DB with extra fields
    await db.query(
      `UPDATE documents 
       SET file_name = ?, file_url = ?, bank_account_number = ?, ifsc_code = ?, applicant_name = ?, applicant_email = ? 
       WHERE id = ?`,
      [
        newFileName,
        newFileUrl,
        bank_account_number || null,
        ifsc_code || null,
        applicant_name || null,
        applicant_email || null,
        documentId]);
    res.json({
      message: "Document updated successfully!",
      file_id: documentId,
      new_file_name: newFileName,
      new_file_url: newFileUrl,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// GET USER DOCUMENTS
// =================================================================
router.get("/documents", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC",
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =================================================================
// GET FORM + DOCUMENTS (WITH NEW FIELDS) where color_id = 1
// =================================================================
router.get("/form", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        fs.*,
        d.id AS document_id,
        d.file_name,
        d.file_url,
        d.uploaded_at,
        d.bank_account_number,
        d.ifsc_code,
        d.applicant_name,
        d.applicant_email
      FROM form_submissions fs
      LEFT JOIN documents d ON fs.id = d.form_submission_id
      WHERE fs.user_id = ? AND fs.color_id = 1
      ORDER BY fs.created_at DESC
    `;

    const [rows] = await db.query(sql, [userId]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No forms found with color_id = 1",
      });
    }

    const formsMap = new Map();

    rows.forEach(r => {
      if (!formsMap.has(r.id)) {
        formsMap.set(r.id, {
          id: r.id,
          qr_code_id: r.qr_code_id,
          user_id: r.user_id,
          name: r.name,
          email: r.email,
          created_at: r.created_at,
          resume: r.resume,
          reason: r.reason,
          application_type: r.application_type,
          status: r.status,
          reviewed: r.reviewed,
          designation: r.designation,
          department_name: r.department_name,
          resume_url: r.resume_url,
          updated_at: r.updated_at,
          number: r.number,
          comments: r.comments,
          color_id: r.color_id,
          documents: []
        });
      }

      // Add documents
      if (r.document_id) {
        formsMap.get(r.id).documents.push({
          id: r.document_id,
          file_name: r.file_name,
          file_url: r.file_url,
          uploaded_at: r.uploaded_at,
          bank_account_number: r.bank_account_number,
          ifsc_code: r.ifsc_code,
          applicant_name: r.applicant_name,
          applicant_email: r.applicant_email
        });
      }
    });

    res.json({ success: true, data: Array.from(formsMap.values()) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
