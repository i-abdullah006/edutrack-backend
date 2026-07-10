// Generates a unique username and a simple, readable password for a new student.
//
// Important: usernames are based on the student's NAME, not their roll number,
// because roll numbers can change later (see rollNumberManager.js - the
// swap-from-end logic on removal). If usernames were based on roll number,
// a student's login would break whenever another student was removed.
// Basing it on name keeps it permanent for the student's entire enrollment.

// Username: first name (lowercase) + random digits, e.g. "ali482"
// The digits make it unique even when multiple students share a first name.
function generateUsername(name) {
  const firstName = (name || 'student').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '') || 'student';
  const digits = Math.floor(100 + Math.random() * 900); // 3-digit suffix for uniqueness
  return `${firstName}${digits}`;
}

// Password: first name (lowercase, no spaces) + 3-5 random digits, e.g. "ali4827"
// Generated separately from the username so they don't end up identical.
function generatePassword(name) {
  const firstName = (name || 'student').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '') || 'student';
  const digitLength = Math.floor(Math.random() * 3) + 3; // 3 to 5 digits
  let digits = '';
  for (let i = 0; i < digitLength; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  return `${firstName}${digits}`;
}

module.exports = { generateUsername, generatePassword };
