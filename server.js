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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
