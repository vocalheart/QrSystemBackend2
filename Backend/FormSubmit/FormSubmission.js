
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
require('dotenv').config({ path: 'E:\\JobPortal\\VocalHeartVisit\\Backend\\.env' });
const database = require('../database/mysql');
const authenticationToken = require('../middleware/AuthenticationToken');

// Validate environment variables
const requiredEnvVars = ['B2_ENDPOINT', 'B2_KEY_ID', 'B2_KEY', 'B2_BUCKET_NAME'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing Backblaze B2 environment variables:', missingEnvVars);
  throw new Error('Backblaze B2 configuration is incomplete');
}

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /pdf|doc|docx/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Configure S3Client for Backblaze B2
const s3Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: 'us-east-005',
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_KEY,
  },
});

// Route: Submit form with file upload
router.post('/form/:code/submit', upload.single('resume'), async (req, res) => {
  const { code } = req.params;
  const { name, email, reason, application_type, designation, department_name } = req.body;
  const resume = req.file;

  if (!name || !email || !application_type || !designation) {
    return res.status(400).json({ message: 'Name, email, application type, and designation are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const [qrCode] = await database.query('SELECT id, user_id FROM qrcodes WHERE code = ?', [code]);
    if (!qrCode.length) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    const { id: qr_code_id, user_id } = qrCode[0];

    const [appType] = await database.query(
      'SELECT id, name FROM ApplicationType WHERE name = ? AND user_id = ?',
      [application_type, user_id]
    );
    if (!appType.length) {
      return res.status(400).json({ message: 'Invalid application type' });
    }

    const [desig] = await database.query(
      'SELECT id, name FROM designation WHERE name = ? AND user_id = ?',
      [designation, user_id]
    );
    if (!desig.length) {
      return res.status(400).json({ message: 'Invalid designation' });
    }

    let departmentNameToStore = null;
    if (department_name) {
      const [dept] = await database.query(
        'SELECT name FROM department WHERE name = ? AND user_id = ?',
        [department_name, user_id]
      );
      if (!dept.length) {
        return res.status(400).json({ message: 'Invalid department name' });
      }
      departmentNameToStore = dept[0].name;
    }
    // Upload resume to Backblaze B2
    let resumeUrl = null;
    if (resume) {
      const fileName = `${Date.now()}_${resume.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadParams = {
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileName,
        Body: resume.buffer,
        ContentType: resume.mimetype,
      };

      try {
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        resumeUrl = fileName; // Store just the file key
        console.log('Resume uploaded successfully:', fileName);

        // Verify file existence
        const headCommand = new HeadObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME,
          Key: fileName,
        });
        await s3Client.send(headCommand);
      } catch (uploadError) {
        console.error('Backblaze B2 upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload resume to Backblaze B2', error: uploadError.message });
      }
    }

    // Insert form data with resume file key
    const [result] = await database.query(
      `INSERT INTO form_submissions 
      (qr_code_id, user_id, name, email, reason, application_type, designation, department_name, resume, created_at, status, reviewed) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        qr_code_id,
        user_id,
        name,
        email,
        reason || null,
        appType[0].name,
        designation,
        departmentNameToStore,
        resumeUrl,
        'pending',
        0,
      ]
    );

    // Insert notification
    const notiMessage = `New ${appType[0].name} submission from "${name}" for ${designation}.`;
    await database.query(
      `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`,
      [user_id, 'Form Submission', notiMessage]
    );

    res.status(201).json({
      message: 'Form submitted successfully',
      user_id,
      data: {
        id: result.insertId,
        qr_code_id,
        user_id,
        name,
        email,
        reason,
        application_type: appType[0].name,
        designation,
        department_name: departmentNameToStore,
        resume: resumeUrl,
        status: 'pending',
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Form Submission Error:', error);
    res.status(500).json({ message: 'Failed to submit form', error: error.message });
  }
});

// Route: Fetch resume signed URL (protected)
router.get('/form/resume/:id', authenticationToken, async (req, res) => {
  const { id } = req.params;
  try {
    let submissionQuery;
    let queryParams;

    if (req.user.role === 'member') {
      // For members, fetch submission where user_id matches their created_by
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ message: 'No associated admin found for this member' });
      }
      submissionQuery = 'SELECT resume, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, user[0].created_by];
    } else {
      // For admins, fetch submission where user_id matches their own id
      submissionQuery = 'SELECT resume, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, req.user.id];
    }

    const [submission] = await database.query(submissionQuery, queryParams);

    if (!submission.length) {
      return res.status(404).json({ message: 'Submission not found or not authorized' });
    }

    const { resume: fileKey } = submission[0];

    if (!fileKey) {
      return res.status(404).json({ message: 'No resume uploaded for this submission' });
    }

    // Verify file existence in Backblaze B2
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.B2_BUCKET_NAME,
        Key: fileKey,
      });
      await s3Client.send(headCommand);
    } catch (error) {
      console.error('File not found in Backblaze B2:', error);
      return res.status(404).json({ message: 'Resume file not found in storage' });
    }

    // Determine content type and disposition
    const extension = fileKey.split('.').pop().toLowerCase();
    let contentType = 'application/octet-stream';
    // Default to download
    let dispositionType = 'attachment'; 
    if (extension === 'pdf') {
      contentType = 'application/pdf';
      // Allow in-browser viewing for PDFs 
      dispositionType = 'inline'; 
    } else if (extension === 'doc') {
      contentType = 'application/msword';
    } else if (extension === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Generate signed URL
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour expiry
      responseContentType: contentType,
      responseContentDisposition: `${dispositionType}; filename="${fileKey}"`,
    });

    res.status(200).json({
      signedUrl,
      mimeType: contentType,
      fileName: fileKey,
    });
  } catch (error) {
    console.error('Resume fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch resume',
      error: error.message,
    });
  }
});

// GET all form submissions
router.get('/formDetails', authenticationToken, async (req, res) => {
  try {
    let submissionQuery;
    let queryParams;

    if (req.user.role === 'member') {
      // For members, fetch submissions where user_id matches their created_by
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ message: 'No associated admin found for this member' });
      }
      submissionQuery = `
        SELECT id, user_id, name, email, created_at, resume, reason, 
               application_type, status, reviewed, designation, department_name
        FROM form_submissions
        WHERE user_id = ?
      `;
      queryParams = [user[0].created_by];
    } else {
      // For admins, fetch submissions where user_id matches their own id
      submissionQuery = `SELECT id, user_id, name, email, created_at, resume, reason, 
        application_type, status, reviewed, designation, department_name
        FROM form_submissions
        WHERE user_id = ?`;
      queryParams = [req.user.id];
    }

    const [submissions] = await database.query(submissionQuery, queryParams);

    // Map submissions to ensure consistent response format
    const formattedSubmissions = submissions.map(submission => ({
      ...submission,
      application_type_name: submission.application_type,
    }));
    res.status(200).json({ data: formattedSubmissions });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// PATCH update submission status
router.patch('/formDetails/:id/status', authenticationToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'approved', 'on_hold'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided' });
  }
  try {
    let submissionQuery;
    let queryParams;
    if (req.user.role === 'member') {
      // For members, ensure submission's user_id matches their created_by
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ message: 'No associated admin found for this member' });
      }
      submissionQuery = 'SELECT id, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, user[0].created_by];
    } else {
      // For admins, ensure submission's user_id matches their own id
      submissionQuery = 'SELECT id, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, req.user.id];
    }
    const [submissions] = await database.query(submissionQuery, queryParams);
    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Submission not found or not authorized' });
    }
    await database.query(
      `UPDATE form_submissions SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    res.status(200).json({ message: `Status updated to ${status}` });
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// PATCH update submission review status
router.patch('/formDetails/:id/review', authenticationToken, async (req, res) => {
  const { id } = req.params;
  const { reviewed } = req.body;

  if (typeof reviewed !== 'number' || ![0, 1].includes(reviewed)) {
    return res.status(400).json({ message: 'Invalid review status provided' });
  }

  try {
    let submissionQuery;
    let queryParams;

    if (req.user.role === 'member') {
      // For members, ensure submission's user_id matches their created_by
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ message: 'No associated admin found for this member' });
      }
      submissionQuery = 'SELECT id, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, user[0].created_by];
    } else {
      // For admins, ensure submission's user_id matches their own id
      submissionQuery = 'SELECT id, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, req.user.id];
    }

    const [submissions] = await database.query(submissionQuery, queryParams);

    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Submission not found or not authorized' });
    }
    await database.query(
      `UPDATE form_submissions SET reviewed = ?, updated_at = NOW() WHERE id = ?`,
      [reviewed, id]
    );
    res.status(200).json({ message: `Submission marked as ${reviewed === 1 ? 'reviewed' : 'unreviewed'}` });
  } catch (error){
    console.error('Error updating submission review status:', error);
    res.status(500).json({ message: 'Failed to update review status' });
  }
});
module.exports = router;
