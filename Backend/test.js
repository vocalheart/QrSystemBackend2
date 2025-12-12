require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  S3Client,
  PutObjectCommand
} = require("@aws-sdk/client-s3");
const db = require("./database/mysql.js");

const router = express.Router();

// ---------------- AWS SDK v3 CLIENT ----------------
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ---------------- Multer Local Storage ----------------
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

// ---------------- Upload to S3 + Save to MySQL ----------------
router.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send({ error: "No file uploaded" });
    const ext = path.extname(req.file.originalname);
    const fileName = `uploads/${Date.now()}${ext}`;
    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    // Store in MySQL
    const [result] = await db.query(
      "INSERT INTO documents (file_name, file_url) VALUES (?, ?)",
      [fileName, fileUrl]
    );

    res.send({
      message: "File uploaded successfully!",
      fileId: result.insertId,
      fileName,
      fileUrl,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ---------------- GET All Files ----------------
router.get("/documents", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM documents ORDER BY uploaded_at DESC"
    );
    res.send(rows);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
