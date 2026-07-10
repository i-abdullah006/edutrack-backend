// Admin model - used only for admin login
// Admin now also supports "Remember Me" via rememberToken, same mechanism as students

const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String, // stored hashed, never in plain text
    required: true
  },
  rememberToken: {
    type: String,
    default: null
  },
  rememberTokenExpiry: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
