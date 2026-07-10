// Settings model
// Admin controls class start time and late cutoff minutes here.
// Whenever the admin changes these, it only affects FUTURE attendance - past
// entries never change, since their present/late/absent status is saved
// permanently at the time it was calculated.

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Only one settings document exists for the whole system
  classStartTime: {
    type: String, // format: "HH:MM", e.g. "08:00"
    required: true,
    default: '08:00'
  },
  lateCutoffMinutes: {
    type: Number, // how many minutes after start time before "late" applies
    required: true,
    default: 10
  },
  // Which attendance method is used for today's session
  todaysMethod: {
    type: String,
    enum: ['face', 'fingerprint', 'manual'],
    default: 'manual'
  },
  // Controls the Islamiat/Pakistan Studies subject pattern for Matric (9th/10th)
  // and Intermediate (11th/12th) independently, since board policy for each
  // level can differ.
  // true  -> the lower class gets "Islamiat" only (covers both years), the
  //          upper class gets "Pakistan Studies" only (covers both years)
  // false -> both subjects appear separately in every class at that level
  combinedIslamiatPakStudiesMatric: {
    type: Boolean,
    default: false
  },
  combinedIslamiatPakStudiesIntermediate: {
    type: Boolean,
    default: false
  },
  // A separate secret password required to change the admin's login password.
  // This is intentionally different from the admin's own login password, so that
  // sharing the login password temporarily with someone else does not let them
  // change it - only someone who also knows the secret password can do that.
  // Stored hashed, same as any other password.
  secretPasswordHash: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
