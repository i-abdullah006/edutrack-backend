// Roll number management.
//
// Strategy: roll numbers are always sequential 1..N with no gaps.
// - Adding a student: they get the next available number (current count + 1).
// - Removing a student: the student holding the HIGHEST roll number is moved
//   into the freed slot. Their username/password never change - only their
//   rollNo field is updated. If the removed student already had the highest
//   roll number, nothing else needs to move.

const Student = require('../models/Student');

// Returns the next roll number to assign to a newly added student
async function getNextRollNumber() {
  const count = await Student.countDocuments();
  return count + 1;
}

// Call this AFTER deleting a student. It finds the student with the highest
// roll number (if any remain) and moves them into the freed slot, unless the
// removed student already held the highest roll number.
async function reassignRollNumberAfterRemoval(removedRollNo) {
  const highestRollStudent = await Student.findOne().sort({ rollNo: -1 });

  // No students left, or the removed student was already the highest - nothing to do
  if (!highestRollStudent || highestRollStudent.rollNo <= removedRollNo) {
    return null;
  }

  const previousRollNo = highestRollStudent.rollNo;
  highestRollStudent.rollNo = removedRollNo;
  await highestRollStudent.save();

  return { studentId: highestRollStudent._id, name: highestRollStudent.name, previousRollNo, newRollNo: removedRollNo };
}

module.exports = { getNextRollNumber, reassignRollNumberAfterRemoval };
