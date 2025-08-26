const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/AuthenticationToken');
const database = require('../database/mysql');
const NodeCache = require('node-cache');
const { query, validationResult, body } = require('express-validator');

// -----------------------------------------------------------------------------------------
// Initialize NodeCache with a 5-minute TTL (Time To Live) for caching responses.
// Checks cache every 60 seconds for expired entries.
// -----------------------------------------------------------------------------------------

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// -----------------------------------------------------------------------------------------
// Input validation middleware for GET /submission/list endpoint.
// Ensures query parameters are valid for filtering, sorting, and pagination.
// -----------------------------------------------------------------------------------------

const validateQuery = [
  query('status')
    .optional()
    .isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'approved', 'on_hold'])
    .withMessage('Invalid status'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'id', 'name'])
    .withMessage('Invalid sort field'),
  query('order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Invalid order'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Invalid page number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Invalid limit'),
  query('department')
    .optional()
    .isString()
    .trim()
    .withMessage('Invalid department'),
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid end date'),
];

// -----------------------------------------------------------------------------------------
// Input validation middleware for POST /submission/status endpoint.
// Ensures submission ID and status are valid.
// -----------------------------------------------------------------------------------------

const validateStatusUpdate = [
  body('submissionId')
    .isInt({ min: 1 })
    .withMessage('Invalid submission ID'),
  body('status')
    .isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'approved', 'on_hold'])
    .withMessage('Invalid status'),
];

// -----------------------------------------------------------------------------------------
// Input validation middleware for POST /contact endpoint.
// Ensures message, type, and email (for support type) are valid.
// -----------------------------------------------------------------------------------------

const validateContact = [
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  body('type')
    .isIn(['support', 'feedback'])
    .withMessage('Invalid type'),
  body('email')
    .if(body('type').equals('support'))
    .isEmail()
    .withMessage('Valid email required for support'),
];

// -----------------------------------------------------------------------------------------
// Middleware to handle validation errors.
// Returns a 400 response with error details if validation fails.
// -----------------------------------------------------------------------------------------

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
  }
  next();
};

// -----------------------------------------------------------------------------------------
// Helper function to retrieve the admin ID for a member user.
// Throws an error if no admin is associated with the member.
// -----------------------------------------------------------------------------------------

async function getAdminId(userId) {
  try {
    const [user] = await database.query('SELECT created_by FROM users WHERE id = ?', [userId]);
    if (!user.length || !user[0].created_by) {
      throw new Error('No associated admin found for this member');
    }
    return user[0].created_by;
  } catch (error) {
    throw new Error(`Failed to fetch admin ID: ${error.message}`);
  }
}

// -----------------------------------------------------------------------------------------
// GET /submission/counter
// Retrieves the total count of form submissions and the date of the last submission.
// Used in the frontend to display submission statistics for the authenticated user.
// Supports both admin and member roles, using the admin ID for members.
// Caches the response for 5 minutes to improve performance.
// -----------------------------------------------------------------------------------------

router.get('/submission/counter', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `counter_${req.user.id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const userIdToUse = req.user.role === 'member' ? await getAdminId(req.user.id) : req.user.id;
    const [rows] = await database.query(
      'SELECT COUNT(*) AS total, MAX(created_at) AS last_submission_date FROM form_submissions WHERE user_id = ?',
      [userIdToUse]
    );

    const response = {
      success: true,
      total: rows[0].total || 0,
      lastSubmissionDate: rows[0].last_submission_date || null,
    };

    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Submission count error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// -----------------------------------------------------------------------------------------
// GET /submission/today
// Retrieves the count of form submissions made today for the authenticated user.
// Used in the frontend to display daily submission statistics.
// Supports both admin and member roles, using the admin ID for members.
// Caches the response for 5 minutes to improve performance.
// -----------------------------------------------------------------------------------------

router.get('/submission/today', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `today_${req.user.id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const userIdToUse = req.user.role === 'member' ? await getAdminId(req.user.id) : req.user.id;
    const [rows] = await database.query(
      `SELECT COUNT(*) AS today_total 
       FROM form_submissions 
       WHERE user_id = ? 
       AND DATE(created_at) = CURDATE()`,
      [userIdToUse]
    );

    const response = {
      success: true,
      todayTotal: rows[0].today_total || 0,
    };

    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Today submission count error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// -----------------------------------------------------------------------------------------
// GET /submission/list
// Retrieves a paginated list of form submissions for the authenticated user.
// Used in the frontend to display submission data with filtering, sorting, and pagination.
// Supports filtering by status, department, and date range, and sorting by specified fields.
// Supports both admin and member roles, using the admin ID for members.
// Caches the response for 5 minutes to improve performance.
// -----------------------------------------------------------------------------------------

router.get('/submission/list', validateQuery, handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const userIdToUse = req.user.role === 'member' ? await getAdminId(req.user.id) : req.user.id;
    const { status, sortBy = 'created_at', order = 'DESC', page = 1, limit = 10, department, startDate, endDate } = req.query;

    const cacheKey = `list_${userIdToUse}_${status || ''}_${sortBy}_${order}_${page}_${limit}_${department || ''}_${startDate || ''}_${endDate || ''}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    let query = `SELECT 
      id, qr_code_id, user_id AS userId, name, email, created_at, resume, 
      reason, application_type, status, reviewed, designation, department_name, 
      resume_url, updated_at
      FROM form_submissions
      WHERE user_id = ?`;
    const params = [userIdToUse];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (department) {
      query += ` AND department_name = ?`;
      params.push(department);
    }
    if (startDate && endDate) {
      query += ` AND created_at BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    const offset = (page - 1) * limit;
    query += ` ORDER BY ${sortBy} ${order} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await database.query(query, params);
    const countParams = [userIdToUse];
    let countQuery = `SELECT COUNT(*) AS total FROM form_submissions WHERE user_id = ?`;
    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }
    if (department) {
      countQuery += ` AND department_name = ?`;
      countParams.push(department);
    }
    if (startDate && endDate) {
      countQuery += ` AND created_at BETWEEN ? AND ?`;
      countParams.push(startDate, endDate);
    }

    const [count] = await database.query(countQuery, countParams);
    const response = {
      success: true,
      submissions: rows,
      total: count[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };

    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Recent submissions error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// -----------------------------------------------------------------------------------------
// GET /submission/trends
// Retrieves submission trends over the past 7 days, grouped by date and status.
// Used in the frontend to display submission analytics.
// Supports both admin and member roles, using the admin ID for members.
// Caches the response for 5 minutes to improve performance.
// -----------------------------------------------------------------------------------------

router.get('/submission/trends', authenticateToken, async (req, res) => {
  try {
    const cacheKey = `trends_${req.user.id}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const userIdToUse = req.user.role === 'member' ? await getAdminId(req.user.id) : req.user.id;

    const [rows] = await database.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count, status 
       FROM form_submissions 
       WHERE user_id = ? 
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at), status 
       ORDER BY date DESC`,
      [userIdToUse]
    );

    const response = { success: true, trends: rows };
    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Submission trends error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// -----------------------------------------------------------------------------------------
// POST /submission/status
// Updates the status of a specific form submission.
// Used in the frontend to modify the status of a submission.
// Validates the submission ID and status, and clears relevant cache entries.
// Supports both admin and member roles, using the admin ID for members.
// -----------------------------------------------------------------------------------------

router.post('/submission/status', validateStatusUpdate, handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const { submissionId, status } = req.body;
    const userIdToUse = req.user.role === 'member' ? await getAdminId(req.user.id) : req.user.id;

    // Verify submission belongs to user
    const [submission] = await database.query(
      'SELECT id FROM form_submissions WHERE id = ? AND user_id = ?',
      [submissionId, userIdToUse]
    );
    if (!submission.length) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Update status
    await database.query(
      'UPDATE form_submissions SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, submissionId]
    );

    // Clear relevant cache
    cache.del(cache.keys().filter((key) => key.startsWith(`list_${userIdToUse}`) || key === `counter_${userIdToUse}` || key === `today_${userIdToUse}` || key === `trends_${userIdToUse}`));

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

// -----------------------------------------------------------------------------------------
// POST /contact
// Submits a contact message (support or feedback) for the authenticated user.
// Used in the frontend to handle user support or feedback submissions.
// Validates the message, type, and email (for support type) before insertion.
// -----------------------------------------------------------------------------------------

router.post('/contact', validateContact, handleValidationErrors, authenticateToken, async (req, res) => {
  try {
    const { email, message, type } = req.body;

    await database.query(
      'INSERT INTO contacts (user_id, email, message, type, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.user.id, email || null, message, type]
    );

    res.json({ success: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} submitted successfully` });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

module.exports = router;