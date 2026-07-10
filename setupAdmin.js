// Run this script ONLY ONCE, to create the first admin account for the whole system
// Command: node setupAdmin.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database');

    const username = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';

    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log('Admin already exists. Nothing to do.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ username, password: hashedPassword });

    console.log('==========================================');
    console.log('Admin account created!');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('==========================================');
    console.log('IMPORTANT: Please change this password after logging in.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupAdmin();
