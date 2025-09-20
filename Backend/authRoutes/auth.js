const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const axios = require('axios');
const geoip = require('geoip-lite');
const pool = require('../database/mysql');
const authenticateToken = require('../middleware/AuthenticationToken');
const transporter = require('../database/Nodemailer');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validate environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in .env');
}
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID must be defined in .env');
}

// Helper function to check if IP is localhost
const isLocalhost = (ip) => ip === '::1' || ip === '127.0.0.1' || ip === 'localhost';

// Helper function to manage IP addresses (max 3)
const updateIpAddresses = (existingIps, newIp) => {
  let ipArray = existingIps ? JSON.parse(existingIps) : [];
  if (!ipArray.includes(newIp)) {
    ipArray.unshift(newIp);
    ipArray = ipArray.slice(0, 3);
  }
  return JSON.stringify(ipArray);
};

// Helper function to generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Pre-signup (store temp data and send OTP)
router.post('/pre-signup', async (req, res) => {
  const { name, email, password, ip } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Name, email, and password are required',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email',
      message: 'Please provide a valid email address',
    });
  }

  if (!validator.isLength(password, { min: 8 })) {
    return res.status(400).json({
      error: 'Invalid password',
      message: 'Password must be at least 8 characters long',
    });
  }

  try {
    const sanitizedName = validator.escape(name.trim());
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const clientIp = ip || req.ip;

    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        error: 'Email exists',
        message: 'This email is already registered',
      });
    }

    const [existingTemp] = await pool.query('SELECT email FROM temp_signups WHERE email = ?', [sanitizedEmail]);
    if (existingTemp.length > 0) {
      await pool.query('DELETE FROM temp_signups WHERE email = ?', [sanitizedEmail]);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const ipAddresses = updateIpAddresses(null, clientIp);

    let city = 'Unknown', country = 'Unknown', region = 'Unknown';
    if (!isLocalhost(clientIp)) {
      try {
        const response = await axios.get(`http://ip-api.com/json/${clientIp}`, { timeout: 3000 });
        if (response.data.status === 'success') {
          city = response.data.city || 'Unknown';
          country = response.data.country || 'Unknown';
          region = response.data.regionName || 'Unknown';
        } else {
          const geo = geoip.lookup(clientIp);
          if (geo) {
            city = geo.city || 'Unknown';
            country = geo.country || 'Unknown';
            region = geo.region || 'Unknown';
          }
        }
      } catch (geoError) {
        console.warn('Geolocation lookup failed:', geoError.message);
        const geo = geoip.lookup(clientIp);
        if (geo) {
          city = geo.city || 'Unknown';
          country = geo.country || 'Unknown';
          region = geo.region || 'Unknown';
        }
      }
    } else {
      city = country = region = 'Localhost';
    }

    await pool.query(
      'INSERT INTO temp_signups (name, email, password, ip_addresses, city, country, region, otp, otp_expires, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [sanitizedName, sanitizedEmail, hashedPassword, ipAddresses, city, country, region, otp, otpExpires]
    );

    const mailOptions = {
      from: '"VocalHeart Infotech Pvt. Ltd." <vocalheart.tech@gmail.com>',
      to: sanitizedEmail,
      subject: 'Your Signup Verification Code',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 4px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://i.ibb.co/gbPrfVSB/Whats-App-Image-2025-03-03-at-17-45-28-b944d3a4-removebg-preview-1.png" alt="VocalHeart Logo" style="height: 40px;">
          </div>
          <h1 style="font-size: 18px; font-weight: 500; color: #2d3748; margin-bottom: 16px;">Signup Verification</h1>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            Thank you for signing up! Please use the following verification code to complete your registration:
          </p>
          <div style="background: #f7fafc; border: 1px dashed #e2e8f0; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; letter-spacing: 2px; font-weight: 600; color: #2d3748;">${otp}</span>
          </div>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            This code will expire in <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.
          </p>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 24px;">
            If you didn't initiate this signup, please contact our support team immediately.
          </p>
          <div style="border-top: 1px solid #e8e8e8; padding-top: 16px;">
            <p style="font-size: 11px; color: #718096; margin-bottom: 8px;">
              Need help? <a href="https://vocalheart.com/support" style="color: #4299e1; text-decoration: none;">Contact our support team</a>
            </p>
            <p style="font-size: 11px; color: #718096; margin: 0;">
              © ${new Date().getFullYear()} VocalHeart Infotech. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    let attempts = 0;
    const maxAttempts = 2;
    let emailSent = false;
    let lastError = null;

    while (attempts < maxAttempts && !emailSent) {
      try {
        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (error) {
        attempts++;
        lastError = error;
        console.warn(`Email sending attempt ${attempts} failed:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!emailSent) {
      console.error('Failed to send OTP email after retries:', lastError.message);
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification code. Please try again later.',
      });
    }

    res.status(200).json({
      message: 'Verification code sent',
      data: { details: 'A 6-digit verification code has been sent to your email.' },
    });
  } catch (error) {
    console.error('Pre-signup Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to initiate signup',
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Email and OTP are required',
    });
  }

  try {
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());

    // Check temp_signups for signup OTP
    const [tempSignups] = await pool.query(
      'SELECT * FROM temp_signups WHERE email = ? AND otp = ? AND otp_expires > ?',
      [sanitizedEmail, otp, new Date()]
    );

    // Check temp_resets for password reset OTP
    const [tempResets] = await pool.query(
      'SELECT * FROM temp_resets WHERE email = ? AND otp = ? AND otp_expires > ?',
      [sanitizedEmail, otp, new Date()]
    );

    // Check users for profile/email/password change OTP
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expires > ?',
      [sanitizedEmail, otp, new Date()]
    );

    if (tempSignups.length === 0 && tempResets.length === 0 && users.length === 0) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'The OTP is invalid or has expired',
      });
    }

    res.status(200).json({
      message: 'OTP verified successfully',
      data: { email: sanitizedEmail },
    });
  } catch (error) {
    console.error('OTP Verification Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to verify OTP',
    });
  }
});

// Signup (only for admins, after OTP verification)
router.post('/signup', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Email is required',
    });
  }

  try {
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const [tempUsers] = await pool.query('SELECT * FROM temp_signups WHERE email = ?', [sanitizedEmail]);
    if (tempUsers.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'No pending signup found for this email',
      });
    }

    const tempUser = tempUsers[0];
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (existingUser.length > 0) {
      await pool.query('DELETE FROM temp_signups WHERE email = ?', [sanitizedEmail]);
      return res.status(400).json({
        error: 'Email exists',
        message: 'This email is already registered',
      });
    }

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, ip_addresses, city, country, region, role, created_at, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)',
      [
        tempUser.name,
        sanitizedEmail,
        tempUser.password,
        tempUser.ip_addresses,
        tempUser.city,
        tempUser.country,
        tempUser.region,
        'admin',
        tempUser.google_id || null
      ]
    );

    await pool.query('DELETE FROM temp_signups WHERE email = ?', [sanitizedEmail]);

    res.status(201).json({
      message: 'User registered successfully',
      data: {
        user: {
          id: result.insertId,
          name: tempUser.name,
          email: sanitizedEmail,
          ip_addresses: JSON.parse(tempUser.ip_addresses),
          city: tempUser.city,
          region: tempUser.region,
          country: tempUser.country,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to register user',
    });
  }
});

// Login (integrated with Google auth)
router.post('/login', async (req, res) => {
  const { email, password, ip, googleToken } = req.body;

  if (googleToken) {
    // Handle Google login/signup
    try {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const google_id = payload.sub;
      const googleEmail = validator.normalizeEmail(payload.email);
      const googleName = payload.name;

      const clientIp = ip || req.ip;

      // Check if user exists by email
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [googleEmail]);

      if (users.length > 0) {
        const user = users[0];
        if (user.google_id === google_id) {
          // Existing Google user, perform login
          const updatedIpAddresses = updateIpAddresses(user.ip_addresses, clientIp);
          await pool.query('UPDATE users SET ip_addresses = ? WHERE id = ?', [updatedIpAddresses, user.id]);

          const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '7d',
          });

          res.status(200).json({
            message: 'Login successful',
            data: {
              token,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                ip_addresses: JSON.parse(updatedIpAddresses),
                role: user.role,
              },
            },
          });
        } else {
          // Email exists but not a Google account
          return res.status(400).json({
            error: 'Email exists',
            message: 'This email is already registered with a password. Please use password login.',
          });
        }
      } else {
        // New Google user, create account (no OTP needed, as Google verified)
        let city = 'Unknown', country = 'Unknown', region = 'Unknown';
        if (!isLocalhost(clientIp)) {
          try {
            const response = await axios.get(`http://ip-api.com/json/${clientIp}`, { timeout: 3000 });
            if (response.data.status === 'success') {
              city = response.data.city || 'Unknown';
              country = response.data.country || 'Unknown';
              region = response.data.regionName || 'Unknown';
            } else {
              const geo = geoip.lookup(clientIp);
              if (geo) {
                city = geo.city || 'Unknown';
                country = geo.country || 'Unknown';
                region = geo.region || 'Unknown';
              }
            }
          } catch (geoError) {
            console.warn('Geolocation lookup failed:', geoError.message);
            const geo = geoip.lookup(clientIp);
            if (geo) {
              city = geo.city || 'Unknown';
              country = geo.country || 'Unknown';
              region = geo.region || 'Unknown';
            }
          }
        } else {
          city = country = region = 'Localhost';
        }

        const ipAddresses = updateIpAddresses(null, clientIp);

        const [result] = await pool.query(
          'INSERT INTO users (name, email, password, ip_addresses, city, country, region, role, created_at, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)',
          [googleName, googleEmail, null, ipAddresses, city, country, region, 'admin', google_id]
        );

        const token = jwt.sign({ id: result.insertId, email: googleEmail, role: 'admin' }, process.env.JWT_SECRET, {
          expiresIn: '7d',
        });

        res.status(200).json({
          message: 'Signup and login successful',
          data: {
            token,
            user: {
              id: result.insertId,
              name: googleName,
              email: googleEmail,
              ip_addresses: JSON.parse(ipAddresses),
              city,
              region,
              country,
              role: 'admin',
            },
          },
        });
      }
    } catch (error) {
      console.error('Google auth error:', error.message);
      return res.status(400).json({
        error: 'Google authentication failed',
        message: 'Invalid Google token or server error.',
      });
    }
  } else {
    // Regular password login
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required',
      });
    }
    try {
      const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
      const clientIp = ip || req.ip;

      const [users] = await pool.query('SELECT id, name, email, password, ip_addresses, role FROM users WHERE email = ?', [
        sanitizedEmail,
      ]);
      if (users.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }
      const user = users[0];
      if (!['admin', 'member'].includes(user.role)) {
        return res.status(403).json({ error: 'Invalid user role' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      const updatedIpAddresses = updateIpAddresses(user.ip_addresses, clientIp);
      await pool.query('UPDATE users SET ip_addresses = ? WHERE id = ?', [updatedIpAddresses, user.id]);

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(200).json({
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            ip_addresses: JSON.parse(updatedIpAddresses),
            role: user.role,
          },
        },
      });
    } catch (error) {
      console.error('Login Error:', error.message);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to log in',
      });
    }
  }
});

// Refresh Token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found', message: 'User does not exist' });
    }

    const user = users[0];
    if (!['admin', 'member'].includes(user.role)) {
      return res.status(403).json({ error: 'Invalid user role' });
    }

    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Token refreshed',
      data: {
        token: newToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to refresh token' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error.message);
    res.status(500).json({ error: 'Server error', message: 'Failed to log out' });
  }
});

// Request OTP (for authenticated users)
router.post('/request-otp', authenticateToken, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({error: 'Validation failed', message: 'Email is required', });
  }

  try {
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    if (sanitizedEmail !== req.user.email) {
      return res.status(403).json({ error: 'Unauthorized',message: 'Email does not match authenticated user',});
    }

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (users.length === 0) {return res.status(404).json({ error: 'User not found',message: 'This email is not registered',});
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?', [otp, otpExpires, sanitizedEmail]);
    const mailOptions = {
      from: '"VocalHeart Infotech Pvt. Ltd." <vocalheart.tech@gmail.com>',
      to: sanitizedEmail,
      subject: 'Your Account Verification Code',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 4px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://i.ibb.co/gbPrfVSB/Whats-App-Image-2025-03-03-at-17-45-28-b944d3a4-removebg-preview-1.png" alt="VocalHeart Logo" style="height: 40px;">
          </div>
          <h1 style="font-size: 18px; font-weight: 500; color: #2d3748; margin-bottom: 16px;">Account Verification</h1>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            You requested to update your account details. Please use the following verification code:
          </p>
          <div style="background: #f7fafc; border: 1px dashed #e2e8f0; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; letter-spacing: 2px; font-weight: 600; color: #2d3748;">${otp}</span>
          </div>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            This code will expire in <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.
          </p>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 24px;">
            If you didn't initiate this request, please contact our support team immediately.
          </p>
          <div style="border-top: 1px solid #e8e8e8; padding-top: 16px;">
            <p style="font-size: 11px; color: #718096; margin-bottom: 8px;">
              Need help? <a href="https://vocalheart.com/support" style="color: #4299e1; text-decoration: none;">Contact our support team</a>
            </p>
            <p style="font-size: 11px; color: #718096; margin: 0;">
              © ${new Date().getFullYear()} VocalHeart Infotech. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    let attempts = 0;
    const maxAttempts = 2;
    let emailSent = false;
    let lastError = null;

    while (attempts < maxAttempts && !emailSent) {
      try {
        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (error) {
        attempts++;
        lastError = error;
        console.warn(`Email sending attempt ${attempts} failed:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!emailSent) {
      console.error('Failed to send OTP email after retries:', lastError.message);
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification code. Please try again later.',
      });
    }

    res.status(200).json({
      message: 'Verification code sent',
      data: { details: 'A 6-digit verification code has been sent to your email.' },
    });
  } catch (error) {
    console.error('Request OTP Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to send verification code',
    });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) { return res.status(400).json({ error: 'Validation failed', message: 'Email is required',});
  }
  try {
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'This email is not registered',
      });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO temp_resets (email, otp, otp_expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, otp_expires = ?',
      [sanitizedEmail, otp, otpExpires, otp, otpExpires]
    );

    const mailOptions = {
      from: '"VocalHeart Infotech Pvt. Ltd." <vocalheart.tech@gmail.com>',
      to: sanitizedEmail,
      subject: 'Your Password Reset Code',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 4px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://i.ibb.co/gbPrfVSB/Whats-App-Image-2025-03-03-at-17-45-28-b944d3a4-removebg-preview-1.png" alt="VocalHeart Logo" style="height: 40px;">
          </div>
          <h1 style="font-size: 18px; font-weight: 500; color: #2d3748; margin-bottom: 16px;">Password Reset Request</h1>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            We received a request to reset your password. Please use the following verification code:
          </p>
          <div style="background: #f7fafc; border: 1px dashed #e2e8f0; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; letter-spacing: 2px; font-weight: 600; color: #2d3748;">${otp}</span>
          </div>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            This code will expire in <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.
          </p>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 24px;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
          <div style="border-top: 1px solid #e8e8e8; padding-top: 16px;">
            <p style="font-size: 11px; color: #718096; margin-bottom: 8px;">
              Need help? <a href="https://vocalheart.com/support" style="color: #4299e1; text-decoration: none;">Contact our support team</a>
            </p>
            <p style="font-size: 11px; color: #718096; margin: 0;">
              © ${new Date().getFullYear()} VocalHeart Infotech. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    let attempts = 0;
    const maxAttempts = 2;
    let emailSent = false;
    let lastError = null;

    while (attempts < maxAttempts && !emailSent) {
      try {
        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (error) {
        attempts++;
        lastError = error;
        console.warn(`Email sending attempt ${attempts} failed:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!emailSent) {
      console.error('Failed to send OTP email after retries:', lastError.message);
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification code. Please try again later.',
      });
    }

    res.status(200).json({
      message: 'Verification code sent',
      data: { details: 'A 6-digit verification code has been sent to your email.' },
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to send verification code',
    });
  }
});

// Resend OTP for Password Reset
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Email is required',
    });
  }

  try {
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'This email is not registered',
      });
    }

    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO temp_resets (email, otp, otp_expires) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = ?, otp_expires = ?',
      [sanitizedEmail, otp, otpExpires, otp, otpExpires]
    );

    const mailOptions = {
      from: '"VocalHeart Infotech Pvt. Ltd." <vocalheart.tech@gmail.com>',
      to: sanitizedEmail,
      subject: 'Your Password Reset Code',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 4px; color: #333;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://i.ibb.co/gbPrfVSB/Whats-App-Image-2025-03-03-at-17-45-28-b944d3a4-removebg-preview-1.png" alt="VocalHeart Logo" style="height: 40px;">
          </div>
          <h1 style="font-size: 18px; font-weight: 500; color: #2d3748; margin-bottom: 16px;">Password Reset Request</h1>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            We received a request to reset your password. Please use the following verification code:
          </p>
          <div style="background: #f7fafc; border: 1px dashed #e2e8f0; border-radius: 4px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; letter-spacing: 2px; font-weight: 600; color: #2d3748;">${otp}</span>
          </div>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 16px;">
            This code will expire in <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.
          </p>
          <p style="font-size: 12px; line-height: 1.5; margin-bottom: 24px;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
          <div style="border-top: 1px solid #e8e8e8; padding-top: 16px;">
            <p style="font-size: 11px; color: #718096; margin-bottom: 8px;">
              Need help? <a href="https://vocalheart.com/support" style="color: #4299e1; text-decoration: none;">Contact our support team</a>
            </p>
            <p style="font-size: 11px; color: #718096; margin: 0;">
              © ${new Date().getFullYear()} VocalHeart Infotech. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    let attempts = 0;
    const maxAttempts = 2;
    let emailSent = false;
    let lastError = null;

    while (attempts < maxAttempts && !emailSent) {
      try {
        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (error) {
        attempts++;
        lastError = error;
        console.warn(`Email sending attempt ${attempts} failed:`, error.message);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!emailSent) {
      console.error('Failed to send OTP email after retries:', lastError.message);
      return res.status(500).json({
        error: 'Email error',
        message: 'Failed to send verification code. Please try again later.',
      });
    }

    res.status(200).json({
      message: 'Verification code sent',
      data: { details: 'A 6-digit verification code has been sent to your email.' },
    });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to send verification code',
    });
  }
});

// Change Password (with OTP verification, for authenticated users)
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword, otp } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword || !otp) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Current password, new password, confirm password, and OTP are required',
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'New password and confirm password do not match',
    });
  }

  if (!validator.isLength(newPassword, { min: 8 })) {
    return res.status(400).json({
      error: 'Invalid password',
      message: 'New password must be at least 8 characters long',
    });
  }

  try {
    const sanitizedEmail = validator.normalizeEmail(req.user.email.toLowerCase());
    const [users] = await pool.query(
      'SELECT id, password FROM users WHERE email = ? AND otp = ? AND otp_expires > ?',
      [sanitizedEmail, otp, new Date()]
    );
    if (users.length === 0) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'The OTP is invalid or has expired',
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Current password is incorrect',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ?, otp = NULL, otp_expires = NULL WHERE id = ?', [
      hashedPassword,
      user.id,
    ]);

    res.status(200).json({
      message: 'Password changed successfully',
      data: { email: sanitizedEmail },
    });
  } catch (error) {
    console.error('Change Password Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to change password',
    });
  }
});

// Reset Password (for unauthenticated users)
router.post('/reset-password', async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Email, OTP, and password are required',
    });
  }

  if (!validator.isLength(password, { min: 8 })) {
    return res.status(400).json({
      error: 'Invalid password',
      message: 'Password must be at least 8 characters long',
    });
  }

  try {
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const [tempResets] = await pool.query(
      'SELECT * FROM temp_resets WHERE email = ? AND otp = ? AND otp_expires > ?',
      [sanitizedEmail, otp, new Date()]
    );
    if (tempResets.length === 0) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'The OTP is invalid or has expired',
      });
    }

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'This email is not registered',
      });
    }

    const user = users[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    await pool.query('DELETE FROM temp_resets WHERE email = ?', [sanitizedEmail]);

    res.status(200).json({
      message: 'Password reset successfully',
      data: { email: sanitizedEmail },
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to reset password',
    });
  }
});

// User Profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, ip_addresses, city, country, region FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found', message: 'User does not exist' });
    }
    const user = users[0];
    if (!['admin', 'member'].includes(user.role)) {
      return res.status(403).json({ error: 'Invalid user role' });
    }
    user.ip_addresses = JSON.parse(user.ip_addresses || '[]');
    res.status(200).json({
      message: 'User fetched successfully',
      data: user,
    });
  } catch (error) {
    console.error('Profile Fetch Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to fetch user profile',
    });
  }
});

// Update User Profile
router.put('/user/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, otp } = req.body;

  if (!name || !email || !otp) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Name, email, and OTP are required',
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      error: 'Invalid email',
      message: 'Please provide a valid email address',
    });
  }

  if (!validator.isLength(name, { min: 2 })) {
    return res.status(400).json({
      error: 'Invalid name',
      message: 'Name must be at least 2 characters long',
    });
  }

  try {
    const sanitizedEmail = validator.normalizeEmail(email.toLowerCase());
    const sanitizedName = validator.escape(name.trim());

    // Verify OTP
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND otp = ? AND otp_expires > ?',
      [req.user.id, otp, new Date()]
    );
    if (users.length === 0) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: 'The OTP is invalid or has expired',
      });
    }

    // Check if user ID matches authenticated user
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only update your own profile',
      });
    }

    // Check if new email is already in use
    if (sanitizedEmail !== req.user.email) {
      const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [sanitizedEmail, req.user.id]);
      if (existingUser.length > 0) {
        return res.status(400).json({
          error: 'Email exists',
          message: 'This email is already registered',
        });
      }
    }

    await pool.query(
      'UPDATE users SET name = ?, email = ?, otp = NULL, otp_expires = NULL WHERE id = ?',
      [sanitizedName, sanitizedEmail, req.user.id]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      data: {
        id: req.user.id,
        name: sanitizedName,
        email: sanitizedEmail,
        role: req.user.role,
      },
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update profile',
    });
  }
});

module.exports = router;
