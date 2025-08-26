const express = require('express');
const router = express.Router();
const database = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');
const bcrypt = require('bcrypt');

// -----------------------------------------------------------------------------------------
// GET /user
// Retrieves the profile data of the authenticated user.
// Used in the frontend (p-rofile.jsx) to display user profile information.
// Ensures the user exists and parses IP addresses if stored as a JSON string.
// -----------------------------------------------------------------------------------------

router.get('/user', authenticateToken, async (req, res) => {
  try {
    // Query to fetch all users using the database connection
    const [users] = await database.query(`
      SELECT id, name, email, created_at, updated_at, country, city, region, ip_addresses
      FROM users
    `);

    // Filter for the current user based on email from JWT
    const currentUser = users.find((u) => u.email === req.user.email);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure ip_addresses is an array (handle JSON string if stored as such)
    if (typeof currentUser.ip_addresses === 'string') {
      currentUser.ip_addresses = JSON.parse(currentUser.ip_addresses);
    }

    res.status(200).json({ data: [currentUser] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to load profile data' });
  }
});

// -----------------------------------------------------------------------------------------
// PUT /user/:id
// Updates the profile data (name and email) of the authenticated user.
// Used in the frontend (p-rofile.jsx) to modify user profile information.
// Validates inputs and ensures the user is authorized to update their own profile.
// -----------------------------------------------------------------------------------------

router.put('/user/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  // Validate input
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // Verify the user exists and matches the authenticated user
    const [users] = await database.query(
      `SELECT id, email FROM users WHERE id = ? AND email = ?`,
      [id, req.user.email]
    );

    if (users.length === 0) {
      return res.status(403).json({ message: 'Unauthorized or user not found' });
    }

    // Update user data
    await database.query(
      `UPDATE users SET name = ?, email = ?, updated_at = NOW() WHERE id = ?`,
      [name, email, id]
    );

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// -----------------------------------------------------------------------------------------
// POST /auth/change-password
// Changes the password of the authenticated user.
// Used in the frontend (p-rofile.jsx) to update the user's password.
// Validates input, verifies the current password, and hashes the new password.
// -----------------------------------------------------------------------------------------

router.post('/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  // Validate input
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All password fields are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirm password do not match' });
  }
  try {
    // Fetch user to verify current password
    const [users] = await database.query(
      `SELECT id, password FROM users WHERE email = ?`,
      [req.user.email]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await database.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;