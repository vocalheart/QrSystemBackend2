const express = require('express');
const database = require('../database/mysql');
const router = express.Router();
const authenticationToken = require('../middleware/AuthenticationToken');

// Haversine formula to calculate distance between two points (in meters)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 //// Distance in meters
  return R * c; 
}

// Get all locations for the authenticated user
router.get('/locations', authenticationToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const [rows] = await database.query(
      'SELECT * FROM LocationCoordinates WHERE user_id = ?',
      [user_id]
    );
    res.status(200).json({ message: 'Locations fetched successfully', result: rows });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Create a new location
router.post('/locations', authenticationToken, async (req, res) => {
  const { place_name, latitude, longitude, distance_in_meters } = req.body;
  const user_id = req.user.id;

  if (!place_name || typeof latitude !== 'number' || typeof longitude !== 'number' || typeof distance_in_meters !== 'number') {
    return res.status(400).json({ message: 'Invalid input' });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || distance_in_meters < 0) {
    return res.status(400).json({ message: 'Invalid coordinates or distance' });
  }
  try {
    const [existing] = await database.query(
      'SELECT * FROM LocationCoordinates WHERE user_id = ?',
      [user_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Only one location allowed per user' });
    }
    await database.query(
      'INSERT INTO LocationCoordinates (user_id, place_name, latitude, longitude, distance_in_meters, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [user_id, place_name, latitude, longitude, distance_in_meters]
    );
    res.status(201).json({ message: 'Location created successfully' });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});




// Update a location
router.put('/locations/:id', authenticationToken, async (req, res) => {
  const { id } = req.params;
  const { place_name, latitude, longitude, distance_in_meters } = req.body;
  const user_id = req.user.id;

  if (!place_name || typeof latitude !== 'number' || typeof longitude !== 'number' || typeof distance_in_meters !== 'number') {
    return res.status(400).json({ message: 'Invalid input' });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || distance_in_meters < 0) {
    return res.status(400).json({ message: 'Invalid coordinates or distance' });
  }
  try {
    const [result] = await database.query(
      'UPDATE LocationCoordinates SET place_name = ?, latitude = ?, longitude = ?, distance_in_meters = ? WHERE id = ? AND user_id = ?',
      [place_name, latitude, longitude, distance_in_meters, id, user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found or unauthorized' });
    }
    res.status(200).json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Delete a location
router.delete('/locations/:id', authenticationToken, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  try {
    const [result] = await database.query(
      'DELETE FROM LocationCoordinates WHERE id = ? AND user_id = ?',
      [id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Location not found or unauthorized' });
    }

    res.status(200).json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Validate user's current location against stored location
router.post('/validate-location', authenticationToken, async (req, res) => {
  const { latitude, longitude } = req.body;
  const user_id = req.user.id;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ message: 'Invalid coordinates', withinRange: false });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: 'Invalid coordinates', withinRange: false });
  }

  try {
    const [location] = await database.query(
      'SELECT latitude, longitude, distance_in_meters FROM LocationCoordinates WHERE user_id = ?',
      [user_id]
    );

    if (location.length === 0) {
      return res.status(404).json({ message: 'No location found for user', withinRange: false });
    }

    const { latitude: storedLat, longitude: storedLon, distance_in_meters } = location[0];
    const distance = calculateDistance(latitude, longitude, storedLat, storedLon);

    if (distance <= distance_in_meters) {
      res.status(200).json({ message: 'User within range', withinRange: true });
    } else {
      res.status(403).json({ message: 'User not within range', withinRange: false });
    }
  } catch (error) {
    console.error('Location validation error:', error);
    res.status(500).json({ message: 'Internal Server Error', withinRange: false });
  }
});

module.exports = router;