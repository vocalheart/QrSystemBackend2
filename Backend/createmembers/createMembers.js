const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/AuthenticationToken');
const pool = require('../database/mysql');
const validator = require('validator');
const bcrypt = require('bcrypt');

// -----------------------------------------------------------------------------------------
// POST /create-member
// Creates a new member user, restricted to admin users only.
// Used in the frontend (createMember.jsx) to add a new member.
// Validates name, email, and password, sanitizes inputs, and hashes the password.
// -----------------------------------------------------------------------------------------
router.post('/create-member', authenticateToken, async (req, res) => {
  const { name, email, password } = req.body;
  // Check if the user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Only admins can create members',
    });
  }

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Name, email, and password are required',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email', message: 'Please provide a valid email address' });
  }

  if (!validator.isLength(password, { min: 6 })) {
    return res.status(400).json({ error: 'Invalid password', message: 'Password must be at least 6 characters' });
  }

  try {
    const sanitizedName = validator.escape(name.trim());
    const sanitizedEmail = validator.normalizeEmail(email);

    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email exists', message: 'This email is already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [sanitizedName, sanitizedEmail, hashedPassword, 'member', req.user.id]
    );

    res.status(201).json({
      message: 'Member created successfully',
      data: {
        id: result.insertId,
        name: sanitizedName,
        email: sanitizedEmail,
        role: 'member',
        created_by: req.user.id,
      },
    });
  } catch (err) {
    console.error('Create Member Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to create member' });
  }
});

// -----------------------------------------------------------------------------------------
// GET /members
// Retrieves all members created by the authenticated admin user.
// Used in the frontend (createMember.jsx) to display the list of members.
// Restricted to admin users only.
// -----------------------------------------------------------------------------------------

router.get('/members', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Only admins can view members',
    });
  }

  try {
    const [members] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE created_by = ? AND role = ?',
      [req.user.id, 'member']
    );
    res.status(200).json({
      message: 'Members fetched successfully',
      data: members,
    });
  } catch (err) {
    console.error('Fetch Members Error:', err.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to fetch members' });
  }
});

// -----------------------------------------------------------------------------------------
// DELETE /members/:id
// Deletes a member user by ID, restricted to admin users who created the member.
// Used in the frontend (createMember.jsx) to remove a member.
// Ensures the member exists and was created by the authenticated admin.
// -----------------------------------------------------------------------------------------

router.delete('/members/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Only admins can delete members',
    });
  }
  try {
    const id = req.params.id;
    const [result] = await pool.query('DELETE FROM users WHERE id = ? AND created_by = ? AND role = ?', [id, req.user.id, 'member']);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found', message: 'Member not found or not authorized to delete' });
    }
    res.status(200).json({ message: 'Member has been successfully deleted' });
  } catch (error) {
    console.error('Delete Member Error:', error.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to delete member' });
  }
});

// -----------------------------------------------------------------------------------------
// PUT /members/:id
// Updates a member's name and email, restricted to admin users who created the member.
// Used in the frontend (createMember.jsx) to edit member details.
// Validates and sanitizes inputs, ensuring the email is unique.
// -----------------------------------------------------------------------------------------

router.put('/members/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Only admins can edit members',
    });
  }

  try {
    const id = req.params.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name and email are required',
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email', message: 'Please provide a valid email address' });
    }

    const sanitizedName = validator.escape(name.trim());
    const sanitizedEmail = validator.normalizeEmail(email);

    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [sanitizedEmail, id]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email exists', message: 'This email is already in use' });
    }

    const [result] = await pool.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ? AND created_by = ? AND role = ?',
      [sanitizedName, sanitizedEmail, id, req.user.id, 'member']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member not found', message: 'Member not found or not authorized to edit' });
    }

    res.status(200).json({
      message: 'Member updated successfully',
      data: { id, name: sanitizedName, email: sanitizedEmail, role: 'member' },
    });
  } catch (error) {
    console.error('Edit Member Error:', error.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to update member' });
  }
});

module.exports = router;