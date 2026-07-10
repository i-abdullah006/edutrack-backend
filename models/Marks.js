// Marks model - one record per student + subject + exam type.
// This lets the admin save marks for one subject at a time and come back
// later to add more subjects for the same exam, without ever being forced
// to fill in every subject at once.

const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String, // e.g. "Class Test", "Mid Term", "Final"
    required: true,
    trim: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  date: {
    type: String, // "YYYY-MM-DD"
    required: true
  }
}, { timestamps: true });

// One record per student+subject+examType - saving again updates instead of duplicating
marksSchema.index({ student: 1, subject: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
