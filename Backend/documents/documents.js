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
router.post("/documents/upload-multiple",authenticateToken, (req, res, next) => {
    req.setTimeout(900000);
    res.setTimeout(900000);
    req.socket.setTimeout(900000);
    req.socket.setNoDelay(true);
    next();
  },

  upload.array("documents", 4),

  async (req, res) => {
    let connection;

    try {
      const userId = req.user.id;
      const { form_submission_id } = req.body;

      // ---------------- VALIDATIONS ----------------
      if (!form_submission_id) {
        return res.status(400).json({ error: "form_submission_id required" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one document required" });
      }

      let documentTypes;
      try {
        documentTypes = JSON.parse(req.body.document_types);
      } catch {
        return res.status(400).json({ error: "Invalid document_types format" });
      }

      if (!Array.isArray(documentTypes)) {
        return res.status(400).json({ error: "document_types must be an array" });
      }

      if (documentTypes.length !== req.files.length) {
        return res.status(400).json({
          error: "document_types must match uploaded files count",
        });
      }

      if (documentTypes.length > 4) {
        return res.status(400).json({ error: "Maximum 4 documents allowed" });
      }

      const allowedTypes = [
        "aadhaar",
        "pan",
        "driving_license",
        "bank_passbook",
      ];

      const uniqueTypes = new Set();

      for (const type of documentTypes) {
        if (!allowedTypes.includes(type)) {
          return res.status(400).json({
            error: `Invalid document type: ${type}`,
          });
        }
        if (uniqueTypes.has(type)) {
          return res.status(400).json({
            error: `Duplicate document type in request: ${type}`,
          });
        }
        uniqueTypes.add(type);
      }

      // ---------------- DB TRANSACTION ----------------
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Validate form submission
      const [form] = await connection.query(
        `SELECT id FROM form_submissions 
         WHERE id = ? AND user_id = ?`,
        [form_submission_id, userId]
      );

      if (!form.length) {
        await connection.rollback();
        return res.status(404).json({
          error: "Invalid form_submission_id",
        });
      }

      // ---------------- CHECK ALREADY UPLOADED DOCS ----------------
      const [existingDocs] = await connection.query(
        `SELECT document_type 
         FROM documents 
         WHERE user_id = ? AND form_submission_id = ?`,
        [userId, form_submission_id]
      );

      const existingTypes = new Set(
        existingDocs.map((doc) => doc.document_type)
      );

      for (const type of documentTypes) {
        if (existingTypes.has(type)) {
          await connection.rollback();
          return res.status(400).json({
            error: `You have already uploaded ${type.replace("_", " ")}`,
          });
        }
      }

      // ---------------- UPLOAD FILES ----------------
      const uploaded = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const type = documentTypes[i];

        const ext = path.extname(file.originalname).toLowerCase();
        const fileName = `uploads/${type}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}${ext}`;

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
           (user_id, form_submission_id, document_type, file_name, file_url)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, form_submission_id, type, fileName, fileUrl]
        );

        uploaded.push({
          id: result.insertId,
          document_type: type,
          file_url: fileUrl,
        });
      }

      await connection.commit();

      return res.json({
        success: true,
        message: "Documents uploaded successfully",
        documents: uploaded,
      });
    } catch (err) {
      if (connection) await connection.rollback();
      console.error(err);
      return res.status(500).json({ error: "Upload failed" });
    } finally {
      if (connection) connection.release();
    }
  }
);

// =================================================================
// UPDATE / REPLACE DOCUMENT FILE
// =================================================================
router.put("/documents/:docId", authenticateToken, upload.single("document"), async (req, res) => {
  let connection;
  try {
    const userId = req.user.id;
    const { docId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "Document file required" });
    }
    connection = await db.getConnection();
    await connection.beginTransaction();
    //   Get existing document
    const [rows] = await connection.query(
      `SELECT file_name, document_type 
         FROM documents 
         WHERE id = ? AND user_id = ?`,
      [docId, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Document not found" });
    }

    const oldFileKey = rows[0].file_name;
    const documentType = rows[0].document_type;

    //  Delete old file from S3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: oldFileKey,
      })
    );

    // Upload new file
    const ext = path.extname(req.file.originalname).toLowerCase();
    const newFileName = `uploads/${documentType}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${ext}`;

    await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: newFileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const newFileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${newFileName}`;
    //  Update DB
    await connection.query(
      `UPDATE documents 
   SET file_name = ?, file_url = ?, uploaded_at = NOW()
   WHERE id = ?`,
      [newFileName, newFileUrl, docId]
    );

    const [updatedDoc] = await connection.query(
      `SELECT * FROM documents WHERE id = ?`,
      [docId]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Document updated successfully",
      data: updatedDoc[0]
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Update document error:", err);
    res.status(500).json({ error: "Failed to update document" });
  } finally {
    if (connection) connection.release();
  }
}
);

// =================================================================
// GET DOCUMENTS BY FORM SUBMISSION ID
// =================================================================
router.get(
  "/documents/form/:formSubmissionId",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { formSubmissionId } = req.params;

      // Validate
      if (!formSubmissionId) {
        return res.status(400).json({ error: "formSubmissionId required" });
      }

      // Fetch documents
      const [documents] = await db.query(
        `SELECT 
           id,
           document_type,
           file_url,
           uploaded_at
         FROM documents
         WHERE form_submission_id = ?
           AND user_id = ?
         ORDER BY uploaded_at DESC`,
        [formSubmissionId, userId]
      );

      if (!documents.length) {
        return res.status(404).json({ message: "No documents found" });
      }
      res.json({
        success: true,
        count: documents.length,
        documents,
      });
    } catch (err) {
      console.error("Get documents error:", err);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  }
);


// =================================================================
// GET DOCUMENTS BY FORM SUBMISSION ID
// =================================================================
router.get("/documentss/visitor/:formSubmissionId",authenticateToken, async (req, res) => {
  try {  
    const userId = req.user.id; 
   const { formSubmissionId } = req.params;
      const [documents] = await db.query(
        `SELECT 
           id,
           document_type,
           file_name,
           file_url,
           uploaded_at
         FROM documents
         WHERE form_submission_id = ?
           AND user_id = ?
         ORDER BY uploaded_at DESC`,
        [formSubmissionId, userId]
      );

      res.json({
        success: true,
        user_id: userId,
        form_submission_id: formSubmissionId,
        count: documents.length,
        documents,
      });
    } catch (err) {
      console.error("Get documents error:", err);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  }
);
router.get("/form", authenticateToken, async (req, res) => {
  let connection;

  try {
    const userId = req.user.id;
    const { colorOnly } = req.query;
    // ───────────────────────────────────────────────────────────────
    // MODE 1: Color-only mode (for admin/HR overview)
    // Returns ALL records where color_id = 1 (flat list, no documents)
    // Example: GET /form?colorOnly=true
    // ───────────────────────────────────────────────────────────────
    if (colorOnly === "true") {
      const [rows] = await db.query(
        `SELECT 
           id,
           qr_code_id,
           user_id,
           name,
           email,
           number,
           created_at,
           resume,
           reason,
           application_type,
           status,
           reviewed,
           designation,
           department_name,
           resume_url,
           updated_at,
           comments,
           color_id
         FROM form_submissions
         WHERE color_id = 1
         ORDER BY created_at DESC`
      );

      return res.json({
        success: true,
        color_id: 1,
        total: rows.length,
        data: rows,
      });
    }

    // ───────────────────────────────────────────────────────────────
    // MODE 2: User's own forms (only color_id = 1)
    // Returns ALL submissions for the current user where color_id = 1
    // with their associated documents (grouped)
    // ───────────────────────────────────────────────────────────────
    connection = await db.getConnection();

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
        d.document_type,
        d.file_name,
        d.file_url,
        d.uploaded_at
      FROM form_submissions fs
      LEFT JOIN documents d 
        ON fs.id = d.form_submission_id
      WHERE fs.user_id = ?
        AND fs.color_id = 1
      ORDER BY fs.created_at DESC
    `;

    const [rows] = await connection.query(sql, [userId]);

    if (!rows.length) {
      return res.json({
        success: true,
        data: [],
        total: 0,
      });
    }
    // Group forms + their documents
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
          document_type: row.document_type,
          file_name: row.file_name,
          file_url: row.file_url,
          uploaded_at: row.uploaded_at,
        });
      }
    });

    const result = Array.from(formsMap.values());

    res.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (err) {
    console.error("Fetch forms error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to load forms" 
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;