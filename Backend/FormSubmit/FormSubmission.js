const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const { body, validationResult } = require('express-validator');
require('dotenv').config({ path: 'E:\\JobPortal\\VocalHeartVisit\\Backend\\.env' });
const database = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');
const transporter = require('../database/Nodemailer');

// Validate environment variables
const requiredEnvVars = ['B2_ENDPOINT', 'B2_KEY_ID', 'B2_KEY', 'B2_BUCKET_NAME', 'DASHBOARD_URL'];
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

// POST /form/:code/submit
router.post('/form/:code/submit', upload.single('resume'), async (req, res) => {
  const { code } = req.params;
  const { name, email, reason, application_type } = req.body;
  const resume = req.file;

  if (!name || !email || !application_type) {
    return res.status(400).json({ message: 'Name, email, and application type are required' });
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
        resumeUrl = fileName;
        console.log('Resume uploaded successfully:', fileName);

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

    const [defaultStatus] = await database.query(
      'SELECT name FROM status WHERE name = ? AND user_id = ?',
      ['pending', user_id]
    );
    if (!defaultStatus.length) {
      return res.status(500).json({ message: 'Default status "pending" not found for user' });
    }

    const [result] = await database.query(
      `INSERT INTO form_submissions 
      (qr_code_id, user_id, name, email, reason, application_type, resume, created_at, status, reviewed, designation, department_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, NULL, NULL)`,
      [qr_code_id, user_id, name, email, reason || null, appType[0].name, resumeUrl, defaultStatus[0].name, 0]
    );

    const notiMessage = `New ${appType[0].name} submission from "${name}".`;
    await database.query(
      `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`,
      [user_id, 'Form Submission', notiMessage]
    );

    const [user] = await database.query('SELECT email FROM users WHERE id = ?', [user_id]);
    if (user.length && user[0].email) {
      const mailOptions = {
        from: '"VocalHeart Tech" <vocalheart.tech@gmail.com>',
        to: user[0].email,
        subject: 'New Form Submission Received',
        text: `You have received a new ${appType[0].name} submission from "${name}". Please review it in your dashboard.`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Form Submission</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Roboto', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1F2937; background-color: #F9FAFB;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="background-color: #DB2777; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">New Form Submission</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 16px; font-size: 14px; color: #1F2937;">
                    You have received a new <strong>${appType[0].name}</strong> submission from <strong>${name}</strong>.
                  </p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #6B7280;"><strong>Name:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #1F2937;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #6B7280;"><strong>Email:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #1F2937;">${email}</td>
                    </tr>
                    ${reason ? `
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #6B7280;"><strong>Reason:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #1F2937;">${reason}</td>
                    </tr>` : ''}
                    ${resumeUrl ? `
                    <tr>
                      <td style="padding: 8px 0; font-size: 14px; color: #6B7280;"><strong>Resume:</strong></td>
                      <td style="padding: 8px 0; font-size: 14px; color: #1F2937;">A resume file has been uploaded.</td>
                    </tr>` : ''}
                  </table>
                  <a
                    href="${process.env.DASHBOARD_URL}/dashboard"
                    style="display: inline-block; padding: 12px 24px; background-color: #DB2777; color: #FFFFFF; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 6px; text-align: center; margin-top: 16px;"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="button"
                    aria-label="Review submission in dashboard"
                  >
                    Review Submission
                  </a>
                </td>
              </tr>
              <tr>
                <td style="background-color: #F3F4F6; padding: 16px; text-align: center; font-size: 12px; color: #6B7280;">
                  <p style="margin: 0;">Sent by <strong>VocalHeart Tech</strong></p>
                  <p style="margin: 4px 0 0;">
                    Need help? <a href="mailto:support@vocalheart.tech" style="color: #DB2777; text-decoration: none;">Contact Support</a>
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>`,
      };
      try {
        await transporter.sendMail(mailOptions);
        console.log('Email notification sent to:', user[0].email);
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    } else {
      console.warn('No user email found for user_id:', user_id);
    }

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
        resume: resumeUrl,
        status: defaultStatus[0].name,
        created_at: new Date(),
        designation: null,
        department_name: null,
      },
    });
  } catch (error) {
    console.error('Form Submission Error:', error);
    res.status(500).json({ message: 'Failed to submit form', error: error.message });
  }
});

// GET /form/resume/:id
router.get('/form/resume/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    let submissionQuery;
    let queryParams;
    if (req.user.role === 'member') {
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ message: 'No associated admin found for this member' });
      }
      submissionQuery = 'SELECT resume, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, user[0].created_by];
    } else {
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

    const extension = fileKey.split('.').pop().toLowerCase();
    let contentType = 'application/octet-stream';
    let dispositionType = 'attachment';
    if (extension === 'pdf') {
      contentType = 'application/pdf';
      dispositionType = 'inline';
    } else if (extension === 'doc') {
      contentType = 'application/msword';
    } else if (extension === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
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

// GET /formDetails
router.get('/formDetails', authenticateToken, async (req, res) => {
  try {
    let submissionQuery;
    let queryParams;

    if (req.user.role === 'member') {
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
      submissionQuery = `
        SELECT id, user_id, name, email, created_at, resume, reason, 
               application_type, status, reviewed, designation, department_name
        FROM form_submissions
        WHERE user_id = ?
      `;
      queryParams = [req.user.id];
    }

    const [submissions] = await database.query(submissionQuery, queryParams);

    const formattedSubmissions = submissions.map((submission) => ({
      ...submission,
      application_type_name: submission.application_type,
    }));
    res.status(200).json({ data: formattedSubmissions });
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// PATCH /formDetails/:id/status
router.patch('/formDetails/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    let submissionQuery;
    let queryParams;
    if (req.user.role === 'member') {
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ message: 'No associated admin found for this member' });
      }
      submissionQuery = 'SELECT id, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, user[0].created_by];
    } else {
      submissionQuery = 'SELECT id, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, req.user.id];
    }
    const [submissions] = await database.query(submissionQuery, queryParams);
    if (submissions.length === 0) {
      return res.status(404).json({ message: 'Submission not found or not authorized' });
    }

    const [validStatus] = await database.query(
      'SELECT name FROM status WHERE name = ? AND user_id = ?',
      [status, submissions[0].user_id]
    );
    if (!validStatus.length) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    await database.query(
      `UPDATE form_submissions SET status = ?, updated_at = NOW() WHERE id = ?`,
      [validStatus[0].name, id]
    );

    const notiMessage = `Submission ID ${id} status updated to "${validStatus[0].name}"`;
    await database.query(
      `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`,
      [submissions[0].user_id, 'Status Update', notiMessage]
    );

    res.status(200).json({ message: `Status updated to ${validStatus[0].name}` });
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// PATCH /formDetails/:id/review
router.patch('/formDetails/:id/review', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { reviewed } = req.body;

  if (typeof reviewed !== 'number' || ![0, 1].includes(reviewed)) {
    return res.status(400).json({ message: 'Invalid review status provided' });
  }

  try {
    let submissionQuery;
    let queryParams;

    if (req.user.role === 'member') {
      const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
      if (!user.length || !user[0].created_by) {
        return res.status(403).json({ message: 'No associated admin found for this member' });
      }
      submissionQuery = 'SELECT id, user_id FROM form_submissions WHERE id = ? AND user_id = ?';
      queryParams = [id, user[0].created_by];
    } else {
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
  } catch (error) {
    console.error('Error updating submission review status:', error);
    res.status(500).json({ message: 'Failed to update review status' });
  }
});

// PATCH /formDetails/:id/update
router.patch(
  '/formDetails/:id/update',
  authenticateToken,
  [
    body('designation')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Designation must not exceed 100 characters'),
    body('department_name')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Department name must not exceed 100 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { id } = req.params;
    const { designation, department_name } = req.body;

    try {
      let submissionQuery;
      let queryParams;
      if (req.user.role === 'member') {
        const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [req.user.id]);
        if (!user.length || !user[0].created_by) {
          return res.status(403).json({ message: 'No associated admin found for this member' });
        }
        submissionQuery = 'SELECT user_id FROM form_submissions WHERE id = ? AND user_id = ?';
        queryParams = [id, user[0].created_by];
      } else {
        submissionQuery = 'SELECT user_id FROM form_submissions WHERE id = ? AND user_id = ?';
        queryParams = [id, req.user.id];
      }
      const [submission] = await database.query(submissionQuery, queryParams);
      if (!submission.length) {
        return res.status(404).json({ message: 'Submission not found or not authorized' });
      }

      let designationToStore = null;
      if (designation) {
        const [desig] = await database.query(
          'SELECT id, name FROM designation WHERE name = ? AND user_id = ?',
          [designation, submission[0].user_id]
        );
        if (!desig.length) {
          return res.status(400).json({ message: 'Invalid designation' });
        }
        designationToStore = desig[0].name;
      }

      let departmentNameToStore = null;
      if (department_name) {
        const [dept] = await database.query(
          'SELECT id, name FROM department WHERE name = ? AND user_id = ?',
          [department_name, submission[0].user_id]
        );
        if (!dept.length) {
          return res.status(400).json({ message: 'Invalid department name' });
        }
        departmentNameToStore = dept[0].name;
      }

      await database.query(
        'UPDATE form_submissions SET designation = ?, department_name = ?, updated_at = NOW() WHERE id = ?',
        [designationToStore, departmentNameToStore, id]
      );

      const notiMessage = `Submission ID ${id} updated with designation "${designationToStore || 'None'}" and department "${departmentNameToStore || 'None'}".`;
      await database.query(
        `INSERT INTO Notification (user_id, type, message, status) VALUES (?, ?, ?, 'unread')`,
        [submission[0].user_id, 'Submission Update', notiMessage]
      );

      res.status(200).json({ message: 'Submission updated successfully' });
    } catch (error) {
      console.error('Update submission error:', error);
      res.status(500).json({ message: 'Failed to update submission', error: error.message });
    }
  }
);

// GET /qrcodes/data
router.get('/qrcodes/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [applicationTypes] = await database.query(
      'SELECT id, name FROM ApplicationType WHERE user_id = ?',
      [userId]
    );
    const [designations] = await database.query(
      'SELECT id, name FROM designation WHERE user_id = ?',
      [userId]
    );
    const [departments] = await database.query(
      'SELECT id, name FROM department WHERE user_id = ?',
      [userId]
    );
    const [statuses] = await database.query(
      'SELECT id, name FROM status WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      applicationTypes,
      designations,
      departments,
      statuses,
    });
  } catch (error) {
    console.error('Error fetching QR code data:', error);
    res.status(500).json({ message: 'Failed to fetch QR code data' });
  }
});

module.exports = router;
