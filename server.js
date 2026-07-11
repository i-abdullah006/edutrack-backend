// Main file that runs the whole server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const marksRoutes = require('./routes/marksRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const curriculumRoutes = require('./routes/curriculumRoutes');
const fingerprintRoutes = require('./routes/fingerprintRoutes');

const app = express();

// Middleware
app.use(cors()); // so the frontend (on a different domain/port) can call this backend

// Increased limit because live photo captures are sent as base64 data URLs,
// which are noticeably larger than the original image file
app.use(express.json({ limit: '10mb' }));

// Serve uploaded student photos statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static public assets (default avatar, etc.)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Connect to the database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/fingerprint', fingerprintRoutes);

// Simple health check route - useful to verify things are working after deployment
app.get('/', (req, res) => {
  res.json({ message: 'Attendance System API is running' });
});

// ===== TEMPORARY SETUP ROUTE =====
// Creates the first admin account, for use on hosts (like Render's free tier)
// that don't provide shell access to run setupAdmin.js directly.
// Protected by requiring the JWT_SECRET as a query parameter, so only someone
// who already has server access (via the Render dashboard's env vars) can
// trigger it. REMOVE THIS ROUTE once the admin account has been created.
app.get('/setup-admin', async (req, res) => {
  try {
    if (req.query.key !== process.env.JWT_SECRET) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const bcrypt = require('bcryptjs');
    const Admin = require('./models/Admin');

    const username = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';

    const existing = await Admin.findOne({ username });
    if (existing) {
      return res.json({ message: 'Admin already exists. Nothing to do.', username });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ username, password: hashedPassword });

    res.json({
      message: 'Admin account created successfully. Remove the /setup-admin route from server.js now.',
      username,
      password
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
