// All login-related logic lives here
// Both Admin and Student support "Remember Me"

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

// Helper to create a login token
function generateToken(id, role) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

// ===== ADMIN LOGIN =====
async function adminLogin(req, res) {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    const token = generateToken(admin._id, 'admin');

    let rememberToken = null;
    if (rememberMe) {
      rememberToken = crypto.randomBytes(32).toString('hex');
      admin.rememberToken = rememberToken;
      admin.rememberTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await admin.save();
    }

    res.json({
      message: 'Admin login successful',
      token,
      rememberToken,
      admin: { id: admin._id, username: admin.username }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== ADMIN AUTO-LOGIN VIA REMEMBER TOKEN =====
async function adminAutoLogin(req, res) {
  try {
    const { rememberToken } = req.body;

    if (!rememberToken) {
      return res.status(400).json({ message: 'Remember token is required.' });
    }

    const admin = await Admin.findOne({
      rememberToken,
      rememberTokenExpiry: { $gt: new Date() }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Remember token is invalid or expired. Please log in again.' });
    }

    const token = generateToken(admin._id, 'admin');

    res.json({
      message: 'Auto-login successful',
      token,
      admin: { id: admin._id, username: admin.username }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== STUDENT LOGIN =====
async function studentLogin(req, res) {
  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const student = await Student.findOne({ username });
    if (!student) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    const token = generateToken(student._id, 'student');

    let rememberToken = null;
    if (rememberMe) {
      rememberToken = crypto.randomBytes(32).toString('hex');
      student.rememberToken = rememberToken;
      student.rememberTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await student.save();
    }

    res.json({
      message: 'Student login successful',
      token,
      rememberToken,
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        classNumber: student.classNumber,
        stream: student.stream,
        username: student.username,
        photoUrl: student.photoUrl,
        hasCustomPhoto: student.hasCustomPhoto
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== STUDENT AUTO-LOGIN VIA REMEMBER TOKEN =====
async function studentAutoLogin(req, res) {
  try {
    const { rememberToken } = req.body;

    if (!rememberToken) {
      return res.status(400).json({ message: 'Remember token is required.' });
    }

    const student = await Student.findOne({
      rememberToken,
      rememberTokenExpiry: { $gt: new Date() }
    });

    if (!student) {
      return res.status(401).json({ message: 'Remember token is invalid or expired. Please log in again.' });
    }

    const token = generateToken(student._id, 'student');

    res.json({
      message: 'Auto-login successful',
      token,
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        classNumber: student.classNumber,
        stream: student.stream,
        username: student.username,
        photoUrl: student.photoUrl,
        hasCustomPhoto: student.hasCustomPhoto
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = { adminLogin, adminAutoLogin, studentLogin, studentAutoLogin };
