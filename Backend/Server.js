const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const allowedOrigins = require('./cors/corsOrigins');
const authRoute = require('./authRoutes/auth');
const authenticateToken = require('./middleware/AuthenticationToken');
const Notification = require('./Notification.js/Notification');
const qrCode = require('./Qr Routes/qr');
const attendance = require('./attendance.js/attendance');
const faceUsersRoutes = require('./attendance.js/face-users');
const department = require('./Department/Department');
const designation = require('./Designation/Designation');
const LocationCoordinates = require('./LocationCoordinates/locationRoutes');
const submissionRoutes = require('./DashborderController/FormSubmissionCounter');
const ApplicationType = require('./ApplicationType/ApplicationType');
const Profile = require('./Profile/Profile');
const FormSubmission = require('./FormSubmit/FormSubmission');
const CreateMember = require('./createmembers/createMembers');

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocket.Server({ path: '/api/ws', server });
const { wsClients, broadcastNewSubmission, broadcastStatusUpdate } = require('./DashborderController/FormSubmissionCounter');

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected:', req.headers.origin);
  wsClients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Middleware
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('CORS origin check:', origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Routes
app.use('/api', CreateMember);
app.use('/api', Profile);
app.use('/api', ApplicationType);
app.use('/api', LocationCoordinates);
app.use('/api', designation);
app.use('/api', Notification);
app.use('/api', department);
app.use('/api', qrCode);
app.use('/api', submissionRoutes);
app.use('/api', FormSubmission);
app.use('/api/attendance', attendance);
app.use('/api/auth', authRoute);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.message.includes('Not allowed by CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// Start server
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`WebSocket server is running at ws://localhost:${port}/api/ws`);
});

// Export broadcast functions for use in other routes
module.exports = { broadcastNewSubmission, broadcastStatusUpdate };