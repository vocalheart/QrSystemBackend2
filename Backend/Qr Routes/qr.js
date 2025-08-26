const express = require('express');
const router = express.Router();
const database = require('../database/mysql');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const authenticationToken = require('../middleware/AuthenticationToken');

// Backblaze B2 S3-Compatible Client Configuration
const s3Client = new S3Client({
  endpoint: `https://${process.env.B2_QR_ENDPOINT || 's3.us-west-002.backblazeb2.com'}`,
  region: 'us-west-002', // Update to your actual Backblaze B2 region
  credentials: {
    accessKeyId: process.env.B2_QR_KEY_ID,
    secretAccessKey: process.env.B2_QR_KEY,
  },
  maxAttempts: 3,
});

// Haversine formula to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Validate base64 string
function isValidBase64(str) {
  if (!str || typeof str !== 'string') return false;
  const base64Regex = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
  return base64Regex.test(str);
}

// Validate PNG buffer
function isValidPngBuffer(buffer) {
  if (!buffer || buffer.length < 8) return false;
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return buffer.slice(0, 8).equals(pngSignature);
}


// Upload PNG file to Backblaze B2
async function uploadToB2(fileBuffer, fileName) {
  try {
    const bucketName = process.env.B2_QR_BUCKET_NAME || 'Qr-Image';
    const endpoint = process.env.B2_QR_ENDPOINT || 's3.us-east-005.backblazeb2.com';

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File buffer is empty or invalid');
    }

    if (!isValidPngBuffer(fileBuffer)) {
      throw new Error('Invalid PNG file format');
    }

    console.log(`Uploading to B2: ${fileName}, Size: ${fileBuffer.length} bytes`);

    const params = {
      Bucket: bucketName,
      Key: `qrcodes/${fileName}`,
      Body: fileBuffer,
      ContentType: 'image/png',
      ContentLength: fileBuffer.length,
    };

    await s3Client.send(new PutObjectCommand(params));

    const fileUrl = `https://${bucketName}.${endpoint}/qrcodes/${fileName}`;
    console.log(`Uploaded to B2 successfully: ${fileUrl}`);

    return fileUrl;

  } catch (error) {
    console.error('B2 Upload Error:', error);
    throw new Error(`Failed to upload to Backblaze B2: ${error.message}`);
  }
}


// Generate signed URL for an image
async function generateSignedUrl(fileName) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.B2_QR_BUCKET_NAME || 'Qr-Image',
      Key: `qrcodes/${fileName}`,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    console.log(`Generated signed URL for ${fileName}`);
    return signedUrl;
  } catch (error) {
    console.error('Signed URL generation error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

// Create QR code
router.post('/qrcodes', authenticationToken, async (req, res) => {
  try {
    const { code, url, image, userId } = req.body;
    console.log('Received request body:', { code, url, userId, image: image ? image.substring(0, 50) + '...' : 'No image' });

    if (!code || !url || !userId) {
      console.error('Missing required fields:', { code, url, userId });
      return res.status(400).json({ message: 'Code, URL, and userId are required' });
    }
    if (userId !== req.user.id) {
      console.error('Unauthorized user ID:', { userId, reqUserId: req.user.id });
      return res.status(403).json({ message: 'Unauthorized user ID' });
    }

    const [[existingCode], [existingUserQR]] = await Promise.all([
      database.query('SELECT code FROM qrcodes WHERE code = ?', [code]),
      database.query('SELECT id FROM qrcodes WHERE user_id = ?', [userId]),
    ]);

    if (existingCode.length > 0) {
      console.warn(`Code ${code} already exists`);
      return res.status(409).json({ message: 'Code already exists' });
    }
    if (existingUserQR.length > 0) {
      console.warn(`User ${userId} already has a QR code with ID ${existingUserQR[0].id}`);
      return res.status(409).json({ message: 'User already has a QR code. Delete the existing one to create a new one.' });
    }

    let imageUrl = null;
    if (image) {
      if (!isValidBase64(image)) {
        console.error('Invalid base64 image data:', image.substring(0, 50));
        return res.status(400).json({ message: 'Invalid base64 image data' });
      }
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');
        if (fileBuffer.length < 100) {
          console.error('Buffer size too small:', fileBuffer.length);
          return res.status(400).json({ message: 'Image data is too small' });
        }
        const fileName = `${code}-${Date.now()}.png`;
        console.log(`Processing image for code ${code}, buffer size: ${fileBuffer.length} bytes`);
        imageUrl = await uploadToB2(fileBuffer, fileName);
        // Generate signed URL for the uploaded image
        imageUrl = await generateSignedUrl(fileName);
      } catch (error) {
        console.error('Image processing error:', error);
        return res.status(400).json({ message: 'Failed to process image data', error: error.message });
      }
    }

    const [result] = await database.query(
      'INSERT INTO qrcodes (code, user_id, url, image) VALUES (?, ?, ?, ?)',
      [code, userId, url, imageUrl || null]
    );
    console.log(`QR code saved with ID: ${result.insertId}, Code: ${code}`);
    res.status(201).json({
      message: 'QR code saved successfully',
      data: { id: result.insertId, code, user_id: userId, url, image: imageUrl, created_at: new Date() },
    });
  } catch (error) {
    console.error('QR Code Save Error:', error);
    res.status(500).json({ message: 'Failed to save QR code', error: error.message });
  }
});

// Get all QR codes for user
router.get('/qrcodes', authenticationToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [qrcodes] = await database.query(
      'SELECT id, code, url, image, created_at FROM qrcodes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Generate signed URLs for each QR code image
    const updatedQRCodes = await Promise.all(
      qrcodes.map(async (qr) => {
        if (qr.image) {
          const fileName = qr.image.split('/').pop();
          const signedUrl = await generateSignedUrl(fileName);
          return { ...qr, image: signedUrl };
        }
        return qr;
      })
    );

    console.log(`Fetched ${updatedQRCodes.length} QR codes for user ${userId}`);
    res.status(200).json({
      message: 'QR codes fetched successfully',
      data: updatedQRCodes,
    });
  } catch (error) {
    console.error('QR Code Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch QR codes', error: error.message });
  }
});

// Get QR code by code
router.get('/qrcodes/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const [qrcodes] = await database.query(
      'SELECT id, code, user_id, url, image, created_at FROM qrcodes WHERE code = ?',
      [code]
    );
    if (qrcodes.length === 0) {
      console.warn(`QR code with code ${code} not found`);
      return res.status(404).json({ message: 'QR code not found' });
    }

    // Generate signed URL for the image
    let updatedQR = qrcodes[0];
    if (updatedQR.image) {
      const fileName = updatedQR.image.split('/').pop();
      const signedUrl = await generateSignedUrl(fileName);
      updatedQR = { ...updatedQR, image: signedUrl };
    }

    console.log(`QR code fetched: ${code}`);
    res.status(200).json({
      message: 'QR code fetched successfully',
      data: updatedQR,
    });
  } catch (error) {
    console.error('QR Code Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch QR code', error: error.message });
  }
});

// Delete QR code
router.delete('/qrcodes/:id', authenticationToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [qrCode] = await database.query('SELECT image FROM qrcodes WHERE id = ? AND user_id = ?', [id, userId]);
    if (qrCode.length === 0) {
      console.warn(`QR code with ID ${id} not found or unauthorized for user ${userId}`);
      return res.status(404).json({ message: 'QR code not found or unauthorized' });
    }
    if (qrCode[0].image) {
      try {
        const fileName = qrCode[0].image.split('/').pop();
        const params = {
          Bucket: process.env.B2_QR_BUCKET_NAME || 'Qr-Image',
          Key: `qrcodes/${fileName}`,
        };
        await s3Client.send(new DeleteObjectCommand(params));
        console.log(`File deleted from B2: ${fileName}`);
      } catch (s3Error) {
        console.warn('Failed to delete file from B2, proceeding with database deletion:', s3Error);
      }
    }

    const [result] = await database.query(
      'DELETE FROM qrcodes WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    console.log(`QR code deleted: ${id}`);
    res.status(200).json({ message: 'Successfully deleted', result });
  } catch (error) {
    console.error('Delete QR Error:', error);
    res.status(500).json({ message: 'Something went wrong while deleting QR code', error: error.message });
  }
});

// Validate QR code and location
router.post('/qrcodes/validate/:code', async (req, res) => {
  const { code } = req.params;
  const { latitude, longitude } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Invalid coordinates', withinRange: false });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: 'Invalid coordinates', withinRange: false });
  }

  try {
    const [qrCode] = await database.query(`SELECT id, user_id FROM qrcodes WHERE code = ?`, [code]);
    if (qrCode.length === 0) {
      return res.status(404).json({ message: 'QR code not found', withinRange: false });
    }

    const { user_id } = qrCode[0];
    const [location] = await database.query(
      `SELECT latitude, longitude, distance_in_meters FROM LocationCoordinates WHERE user_id = ?`,
      [user_id]
    );
    if (location.length === 0) {
      return res.status(200).json({ message: 'No location set, access granted', withinRange: true });
    }

    const distance = calculateDistance(latitude, longitude, location[0].latitude, location[0].longitude);
    if (distance <= location[0].distance_in_meters) {
      res.status(200).json({ message: 'Valid QR code and within range', withinRange: true });
    } else {
      res.status(403).json({ message: 'User not within range', withinRange: false });
    }
  } catch (error) {
    console.error('QR code validation error:', error);
    res.status(500).json({ message: 'Internal Server Error', withinRange: false, error: error.message });
  }
});

// Check if location is required for QR code
router.get('/qrcodes/:code/location', async (req, res) => {
  try {
    const { code } = req.params;
    const [qrCode] = await database.query('SELECT user_id FROM qrcodes WHERE code = ?', [code]);
    if (!qrCode.length) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    const user_id = qrCode[0].user_id;
    const [location] = await database.query(
      `SELECT id FROM LocationCoordinates WHERE user_id = ?`,
      [user_id]
    );

    const required = location.length > 0;
    res.json({
      required,
      message: required ? 'Location validation required' : 'No location validation needed'
    });
  } catch (error) {
    console.error('Location Check Error:', error);
    res.status(500).json({ message: 'Failed to check location requirement', error: error.message });
  }
});

// Fetch application types, departments, and designations
router.get('/qrcodes/:code/data', async (req, res) => {
  try {
    const { code } = req.params;
    const [qrCode] = await database.query('SELECT user_id FROM qrcodes WHERE code = ?', [code]);
    if (!qrCode.length) {
      console.warn(`QR code with code ${code} not found`);
      return res.status(404).json({ message: 'QR code not found' });
    }

    const user_id = qrCode[0].user_id;
    const [[applicationTypes], [departments], [designations]] = await Promise.all([
      database.query('SELECT id, name FROM ApplicationType WHERE user_id = ?', [user_id]),
      database.query('SELECT id, name FROM department WHERE user_id = ?', [user_id]),
      database.query('SELECT id, name FROM designation WHERE user_id = ?', [user_id]),
    ]);

    res.json({
      message: 'Data fetched successfully',
      applicationTypes,
      departments,
      designations,
    });
  } catch (error) {
    console.error('Data Fetch Error:', error);
    res.status(500).json({ message: 'Failed to fetch data', error: error.message });
  }
});

// Fetch QR code for authenticated user
router.get('/qrcodes/user', authenticationToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const [qrCode] = await database.query(`SELECT code FROM qrcodes WHERE user_id = ?`, [user_id]);
    if (qrCode.length === 0) {
      console.warn(`No QR code found for user ${user_id}`);
      return res.status(404).json({ message: 'No QR code found for user' });
    }
    res.status(200).json({ message: 'QR code fetched successfully', code: qrCode[0].code });
  } catch (error) {
    console.error('QR code fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});  

module.exports = router;