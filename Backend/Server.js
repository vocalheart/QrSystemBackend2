const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const allowedOrigins = require('./cors/corsOrigins');
const authRoute = require('./authRoutes/auth');
const Notification = require('./Notification.js/Notification');
const qrCode = require('./Qr Routes/qr');
const department = require('./Department/Department');
const designation = require('./Designation/Designation');
const LocationCoordinates = require('./LocationCoordinates/locationRoutes');
const submissionRoutes = require('./DashborderController/FormSubmissionCounter');
const ApplicationType = require('./ApplicationType/ApplicationType');
const Profile = require('./Profile/Profile');
const FormSubmission = require('./FormSubmit/FormSubmission');
const CreateMember = require('./createmembers/createMembers');
const status = require('./ApplicationStatus/Status');
const colors = require('./colors/color');
const documents = require('./documents/documents');
const additinoalInformation = require('./documents/additional-info')
const workingStatus = require('./documents/workingstatus');

const app = express();
const port = process.env.PORT || 5000;
// Middleware         
app.use(helmet());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
app.use('/api/auth', authRoute);
app.use('/api', status);  
app.use('/api', colors)
app.use('/api', documents)
app.use('/api', additinoalInformation)
app.use('/api', workingStatus)


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
// In Express, ensure COOP is not overly restrictive
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});   
app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Opener-Policy');
  next();
});

// ONLY FOR TESTING
// Start server
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Increase global server timeouts
server.timeout = 900000; // 15 minutes
server.keepAliveTimeout = 900000;
server.headersTimeout = 900000;                   