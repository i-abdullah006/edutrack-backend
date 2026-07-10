// Student model
//
// Roll number strategy: roll numbers are always sequential (1 to N, no gaps).
// When a student is removed, the student holding the HIGHEST roll number is
// moved into the freed slot (their username/password never change, only
// their rollNo field updates). This is much cheaper than renumbering every
// student between the removed one and the end.
//
// Attendance and Marks records link to students via their MongoDB _id
// (a permanent internal identifier), never via rollNo directly. This means
// when a student's rollNo changes (due to the swap above), their attendance
// and marks history automatically displays under the new rollNo with zero
// extra database writes, since it's always looked up through the same _id.

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  rollNo: {
    type: Number,
    required: true,
    unique: true
  },
  classNumber: {
    type: Number, // 9, 10, 11, or 12
    required: true,
    enum: [9, 10, 11, 12]
  },
  stream: {
    type: String, // 'science' or 'tech' for 9/10; 'fsc' or 'ics' for 11/12
    required: true
  },
  subGroup: {
    type: String, // e.g. 'agriculture', 'pre_medical', 'group_2' - null if not applicable
    default: null
  },
  elective: {
    type: String, // e.g. 'Biology' or 'Computer Science' - only used for Matric Science stream
    default: null
  },
  subjects: {
    type: [String], // final resolved subject list for this student, computed at add-time
    default: []
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String, // hashed - used for actual authentication
    required: true
  },
  plainPassword: {
    type: String, // stored in readable form so admin can view/share it anytime
    required: true
  },
  photoUrl: {
    type: String, // path/URL to the student's photo, or null if using the default avatar
    default: null
  },
  hasCustomPhoto: {
    type: Boolean, // false = using default avatar, true = admin captured/uploaded a real photo
    default: false
  },
  faceDescriptor: {
    type: [Number], // face-api.js descriptor computed from the student's photo, used for face-match attendance
    default: null
  },
  fingerprintCredential: {
    type: mongoose.Schema.Types.Mixed, // WebAuthn credential registered on the admin's device for this student
    default: null
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

module.exports = mongoose.model('Student', studentSchema);
