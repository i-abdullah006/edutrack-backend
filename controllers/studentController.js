// Student add/remove/edit/list logic - admin only.
//
// Key behaviors:
// - Roll numbers auto-assigned (next available number), never typed by admin
// - Photos arrive as base64 data URLs (live camera capture in the browser),
//   saved to disk via photoStorage.js
// - Removing a student PERMANENTLY deletes them along with all their
//   attendance and marks history (frontend confirms this twice before
//   calling this endpoint), then swaps the highest-roll student into the
//   freed slot
// - Duplicate names are flagged so the frontend can show father's name for
//   disambiguation

const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Settings = require('../models/Settings');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');
const { resolveSubjects } = require('../utils/curriculum');
const { getNextRollNumber, reassignRollNumberAfterRemoval } = require('../utils/rollNumberManager');
const { saveBase64Photo, deletePhotoFile } = require('../utils/photoStorage');

// Generates a username/password pair, retrying on the rare collision
async function generateUniqueCredentials(name) {
  let username, attempts = 0;
  do {
    username = generateUsername(name);
    attempts++;
  } while ((await Student.findOne({ username })) && attempts < 10);

  const plainPassword = generatePassword(name);
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  return { username, plainPassword, hashedPassword };
}

// ===== ADD A NEW STUDENT =====
async function addStudent(req, res) {
  try {
    const {
      name, fatherName, contactNumber,
      classNumber, stream, subGroup, elective,
      photoDataUrl // optional base64 data URL from a live camera capture; admin may skip this
    } = req.body;

    if (!name || !fatherName || !contactNumber || !classNumber || !stream) {
      return res.status(400).json({ message: 'Name, father\'s name, contact number, class, and stream are required.' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const subjects = resolveSubjects({
      classNumber: Number(classNumber),
      stream,
      subGroup: subGroup || null,
      elective: elective || null,
      combinedIslamiatPakStudiesMatric: settings.combinedIslamiatPakStudiesMatric,
      combinedIslamiatPakStudiesIntermediate: settings.combinedIslamiatPakStudiesIntermediate
    });

    const rollNo = await getNextRollNumber();
    const { username, plainPassword, hashedPassword } = await generateUniqueCredentials(name);

    let photoUrl = null;
    let hasCustomPhoto = false;
    if (photoDataUrl) {
      photoUrl = saveBase64Photo(photoDataUrl, username);
      hasCustomPhoto = true;
    }

    const student = await Student.create({
      name,
      fatherName,
      contactNumber,
      rollNo,
      classNumber: Number(classNumber),
      stream,
      subGroup: subGroup || null,
      elective: elective || null,
      subjects,
      username,
      password: hashedPassword,
      plainPassword,
      photoUrl,
      hasCustomPhoto
    });

    res.status(201).json({
      message: 'Student added successfully',
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        username: student.username,
        password: plainPassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET LIST OF ALL STUDENTS =====
// Includes plainPassword so the admin can always view credentials from the list.
// Also flags students whose name is shared with another student, so the
// frontend can display father's name alongside for disambiguation, and
// whether a fingerprint has been enrolled (without exposing the raw
// credential data itself).
async function getAllStudents(req, res) {
  try {
    const students = await Student.find()
      .select('-password -rememberToken -rememberTokenExpiry -faceDescriptor')
      .sort({ rollNo: 1 });

    const nameCounts = {};
    students.forEach((s) => {
      const key = s.name.trim().toLowerCase();
      nameCounts[key] = (nameCounts[key] || 0) + 1;
    });

    const result = students.map((s) => {
      const key = s.name.trim().toLowerCase();
      const obj = s.toObject();
      const hasFingerprintEnrolled = !!obj.fingerprintCredential;
      delete obj.fingerprintCredential;
      return {
        ...obj,
        hasDuplicateName: nameCounts[key] > 1,
        hasFingerprintEnrolled
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== GET ONE STUDENT'S DETAIL =====
async function getStudentById(req, res) {
  try {
    const student = await Student.findById(req.params.id)
      .select('-password -rememberToken -rememberTokenExpiry -faceDescriptor');
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    const obj = student.toObject();
    const hasFingerprintEnrolled = !!obj.fingerprintCredential;
    delete obj.fingerprintCredential;
    res.json({ ...obj, hasFingerprintEnrolled });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== EDIT A STUDENT =====
// Editing name/father's name/contact/photo regenerates username and password,
// since the old ones are tied to the old details and should not persist
// alongside changed information (per admin's request).
async function updateStudent(req, res) {
  try {
    const { name, fatherName, contactNumber, photoDataUrl } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (name) student.name = name;
    if (fatherName) student.fatherName = fatherName;
    if (contactNumber) student.contactNumber = contactNumber;

    if (photoDataUrl) {
      if (student.hasCustomPhoto && student.photoUrl) {
        deletePhotoFile(student.photoUrl);
      }
      student.photoUrl = saveBase64Photo(photoDataUrl, student.username);
      student.hasCustomPhoto = true;
      student.faceDescriptor = null; // old face data no longer matches the new photo, needs re-enrollment
    }

    // Regenerate credentials since student details changed
    const { username, plainPassword, hashedPassword } = await generateUniqueCredentials(student.name);
    student.username = username;
    student.password = hashedPassword;
    student.plainPassword = plainPassword;

    await student.save();

    res.json({
      message: 'Student updated successfully. New login credentials have been generated.',
      student: {
        id: student._id,
        name: student.name,
        username: student.username,
        password: plainPassword
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== REMOVE A STUDENT (permanent - deletes account + all history) =====
// The frontend must confirm this twice before calling this endpoint, since
// it cannot be undone. Deletes the student's attendance and marks records
// and their photo file, then moves the highest-roll-number student into the
// freed slot.
async function removeStudent(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const removedRollNo = student.rollNo;

    if (student.hasCustomPhoto && student.photoUrl) {
      deletePhotoFile(student.photoUrl);
    }

    await Attendance.deleteMany({ student: student._id });
    await Marks.deleteMany({ student: student._id });
    await Student.findByIdAndDelete(student._id);

    const swapResult = await reassignRollNumberAfterRemoval(removedRollNo);

    res.json({
      message: 'Student and all their history have been permanently removed.',
      rollNumberSwap: swapResult
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== RESET A STUDENT'S PASSWORD (keeps username the same) =====
async function resetStudentPassword(req, res) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const newPlainPassword = generatePassword(student.name);
    student.password = await bcrypt.hash(newPlainPassword, 10);
    student.plainPassword = newPlainPassword;
    await student.save();

    res.json({ message: 'Password reset successfully', newPassword: newPlainPassword });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = {
  addStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  removeStudent,
  resetStudentPassword
};
