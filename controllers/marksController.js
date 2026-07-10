// Logic for adding and viewing academic marks records.
//
// Admin picks a student, sees only THAT student's assigned subjects (from
// student.subjects), picks an exam type and one subject, enters marks, saves.
// They can immediately do another subject, or come back later - never
// forced to fill every subject in one sitting. Saving the same
// student+subject+examType again UPDATES the existing record (acts as edit).

const Marks = require('../models/Marks');
const Student = require('../models/Student');

// ===== ADD OR UPDATE MARKS FOR ONE SUBJECT =====
// Because of the unique index on (student, subject, examType), saving the
// same combination again updates in place - this naturally gives us the
// "edit to add more subjects later" flow without a separate edit endpoint.
async function saveMarks(req, res) {
  try {
    const { studentId, subject, examType, marksObtained, totalMarks, date } = req.body;

    if (!studentId || !subject || !examType || marksObtained === undefined || !totalMarks) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (marksObtained > totalMarks) {
      return res.status(400).json({ message: 'Marks obtained cannot be greater than total marks.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (!student.subjects.includes(subject)) {
      return res.status(400).json({ message: `${subject} is not one of this student's assigned subjects.` });
    }

    const marks = await Marks.findOneAndUpdate(
      { student: studentId, subject, examType },
      {
        student: studentId,
        subject,
        examType,
        marksObtained,
        totalMarks,
        date: date || new Date().toISOString().split('T')[0]
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Marks saved successfully', marks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET A STUDENT'S SUBJECT LIST WITH MARKS-ENTRY STATUS (admin) =====
// Shows which subjects already have marks for a given exam type, and which
// are still missing - so admin can see progress without being forced to
// fill everything before saving anything.
async function getStudentSubjectsForExam(req, res) {
  try {
    const { studentId } = req.params;
    const { examType } = req.query;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const existingMarks = examType
      ? await Marks.find({ student: studentId, examType })
      : [];

    const subjectStatus = student.subjects.map((subject) => {
      const entry = existingMarks.find((m) => m.subject === subject);
      return {
        subject,
        hasMarks: !!entry,
        marksObtained: entry?.marksObtained ?? null,
        totalMarks: entry?.totalMarks ?? null
      };
    });

    res.json({ subjects: subjectStatus });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET ALL MARKS FOR A STUDENT, GROUPED BY EXAM TYPE (admin) =====
// Each exam type gets its own separate sum (e.g. Class Test: 45/50, Final:
// 90/100) - these are never combined into one overall total, since mixing
// marks from different exam types together would be misleading.
async function getStudentMarks(req, res) {
  try {
    const { studentId } = req.params;
    const marks = await Marks.find({ student: studentId }).sort({ examType: 1, subject: 1 });

    const grouped = {};
    marks.forEach((m) => {
      if (!grouped[m.examType]) grouped[m.examType] = [];
      grouped[m.examType].push(m);
    });

    const examTypeSummaries = {};
    Object.entries(grouped).forEach(([examType, entries]) => {
      const obtained = entries.reduce((sum, m) => sum + m.marksObtained, 0);
      const possible = entries.reduce((sum, m) => sum + m.totalMarks, 0);
      const percentage = possible > 0 ? ((obtained / possible) * 100).toFixed(2) : 0;
      examTypeSummaries[examType] = { obtained, possible, percentage };
    });

    res.json({ groupedMarks: grouped, examTypeSummaries });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET MY OWN MARKS, GROUPED BY EXAM TYPE (student) =====
async function getMyMarks(req, res) {
  try {
    const studentId = req.user.id;
    const marks = await Marks.find({ student: studentId }).sort({ examType: 1, subject: 1 });

    const grouped = {};
    marks.forEach((m) => {
      if (!grouped[m.examType]) grouped[m.examType] = [];
      grouped[m.examType].push(m);
    });

    const examTypeSummaries = {};
    Object.entries(grouped).forEach(([examType, entries]) => {
      const obtained = entries.reduce((sum, m) => sum + m.marksObtained, 0);
      const possible = entries.reduce((sum, m) => sum + m.totalMarks, 0);
      const percentage = possible > 0 ? ((obtained / possible) * 100).toFixed(2) : 0;
      examTypeSummaries[examType] = { obtained, possible, percentage };
    });

    res.json({ groupedMarks: grouped, examTypeSummaries });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== DELETE A SINGLE SUBJECT'S MARKS ENTRY =====
async function deleteMarks(req, res) {
  try {
    const marks = await Marks.findByIdAndDelete(req.params.id);
    if (!marks) {
      return res.status(404).json({ message: 'Marks record not found.' });
    }
    res.json({ message: 'Marks entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = { saveMarks, getStudentSubjectsForExam, getStudentMarks, getMyMarks, deleteMarks };
