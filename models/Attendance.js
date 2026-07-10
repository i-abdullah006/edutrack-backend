// Attendance model
// Each entry stores date, time, status (present/late/absent), and method
// Both present and absent entries record date + time, as required

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  date: {
    type: String, // format: "YYYY-MM-DD" - kept as a string to make daily lookups simple
    required: true
  },
  time: {
    type: String, // format: "HH:MM:SS" - when it was marked (present or absent)
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    required: true
  },
  method: {
    type: String,
    enum: ['face', 'fingerprint', 'manual'],
    required: true
  }
}, { timestamps: true });

// A student can only have one attendance entry per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
