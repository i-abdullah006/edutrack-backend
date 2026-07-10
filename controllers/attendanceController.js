// Attendance marking logic - supports Manual, Face Recognition, and Fingerprint.
//
// Face flow: admin selects "Face" as today's method, camera scans each
// student in turn against their stored face descriptor. A match marks them
// present with the time. If no confident match is found, the ONLY fallback
// is Manual for that student (per the confirmed flow - no auto-fallback to
// fingerprint).
//
// Fingerprint flow: admin selects the student from the list, that student
// confirms via the device's fingerprint sensor (WebAuthn). If it fails, the
// fallback is Manual for that student.

const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const Student = require('../models/Student');
const { findBestMatch } = require('../utils/faceMatching');

async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

// Decide present vs late based on current settings (never affects past entries)
function calculateStatus(currentTime, classStartTime, lateCutoffMinutes) {
  const [curH, curM] = currentTime.split(':').map(Number);
  const [startH, startM] = classStartTime.split(':').map(Number);

  const curMinutes = curH * 60 + curM;
  const startMinutes = startH * 60 + startM;
  const cutoffMinutes = startMinutes + lateCutoffMinutes;

  return curMinutes <= cutoffMinutes ? 'present' : 'late';
}

async function saveAttendanceRecord({ studentId, status, method, date }) {
  const settings = await getSettings();
  const now = new Date();
  const attendanceDate = date || now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0];

  let finalStatus = status;
  if (status === 'present') {
    finalStatus = calculateStatus(currentTime, settings.classStartTime, settings.lateCutoffMinutes);
  }

  return Attendance.findOneAndUpdate(
    { student: studentId, date: attendanceDate },
    { student: studentId, date: attendanceDate, time: currentTime, status: finalStatus, method },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// ===== MANUAL: mark one student =====
async function markAttendance(req, res) {
  try {
    const { studentId, status, date } = req.body;
    if (!studentId || !status) {
      return res.status(400).json({ message: 'Student and status are required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const attendance = await saveAttendanceRecord({ studentId, status, method: 'manual', date });
    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== MANUAL: bulk mark whole class =====
async function markBulkAttendance(req, res) {
  try {
    const { records, date } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Attendance records are required.' });
    }

    const results = [];
    for (const record of records) {
      const attendance = await saveAttendanceRecord({
        studentId: record.studentId,
        status: record.status,
        method: 'manual',
        date
      });
      results.push(attendance);
    }

    res.json({ message: `Attendance marked for ${results.length} students`, results });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== FACE: match a scanned descriptor against all students, mark present if matched =====
// The browser does the actual face detection (face-api.js) and sends just the
// 128-number descriptor here. This endpoint does the comparison and, on a
// confident match, records attendance. If no match is found, it reports that
// back so the frontend can prompt for Manual entry for that student.
async function markAttendanceByFace(req, res) {
  try {
    const { descriptor, date } = req.body;
    if (!descriptor || !Array.isArray(descriptor)) {
      return res.status(400).json({ message: 'A face descriptor is required.' });
    }

    const students = await Student.find({ faceDescriptor: { $ne: null } }).select('_id name rollNo faceDescriptor');
    const candidateList = students.map((s) => ({ studentId: s._id.toString(), descriptor: s.faceDescriptor }));

    const match = findBestMatch(descriptor, candidateList);

    if (!match) {
      return res.status(200).json({ matched: false, message: 'No confident match found. Please use Manual for this student.' });
    }

    const attendance = await saveAttendanceRecord({ studentId: match.studentId, status: 'present', method: 'face', date });
    const matchedStudent = students.find((s) => s._id.toString() === match.studentId);

    res.json({
      matched: true,
      student: { id: matchedStudent._id, name: matchedStudent.name, rollNo: matchedStudent.rollNo },
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== FINGERPRINT: mark present after successful WebAuthn verification =====
// The actual fingerprint verification happens in fingerprintController
// (verifyAuthentication). Once that succeeds, the frontend calls this
// endpoint to actually record the attendance.
async function markAttendanceByFingerprint(req, res) {
  try {
    const { studentId, date } = req.body;
    if (!studentId) {
      return res.status(400).json({ message: 'Student is required.' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const attendance = await saveAttendanceRecord({ studentId, status: 'present', method: 'fingerprint', date });
    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET FULL ATTENDANCE FOR ONE DAY (admin) =====
async function getAttendanceByDate(req, res) {
  try {
    const { date } = req.params;
    const records = await Attendance.find({ date }).populate('student', 'name rollNo classNumber');
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET FULL ATTENDANCE HISTORY FOR ONE STUDENT (admin) =====
async function getStudentAttendance(req, res) {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({ student: studentId }).sort({ date: -1 });

    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0;

    res.json({ records, summary: { total, presentCount, percentage } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET MY OWN ATTENDANCE (student) =====
async function getMyAttendance(req, res) {
  try {
    const studentId = req.user.id;
    const records = await Attendance.find({ student: studentId }).sort({ date: -1 });

    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const percentage = total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0;

    res.json({ records, summary: { total, presentCount, percentage } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = {
  markAttendance,
  markBulkAttendance,
  markAttendanceByFace,
  markAttendanceByFingerprint,
  getAttendanceByDate,
  getStudentAttendance,
  getMyAttendance
};
