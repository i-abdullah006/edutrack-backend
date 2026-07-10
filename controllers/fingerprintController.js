// Fingerprint (WebAuthn) enrollment and verification.
//
// How this works in practice, given the confirmed flow:
// - At student-add time, admin can optionally have the student touch the
//   admin device's fingerprint sensor once, to REGISTER ("enroll") their
//   fingerprint against their student account.
// - During attendance, admin selects the student from the list first, then
//   that student touches the sensor again to CONFIRM it's really them
//   (WebAuthn cannot identify a person from a "blind" scan - it can only
//   confirm a fingerprint against an already-chosen account, which is why
//   the admin must pick the student first).
// - If the confirmation fails (wrong finger / sensor error), the admin
//   falls back to Manual for that student, per the agreed flow.

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const Student = require('../models/Student');

// These identify this application to WebAuthn. In production, rpID must be
// the actual domain the app is served from (e.g. "yourschool.com"), and
// origin must match exactly (protocol + domain + port).
const RP_NAME = 'EduTrack Attendance System';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

// Temporary in-memory store for challenges during the enroll/verify handshake.
// A challenge is only needed for a few seconds while the browser prompts the
// user, so this doesn't need to be persisted to the database.
const pendingChallenges = new Map();

// ===== STEP 1 of enrollment: generate options for the browser to start registration =====
async function getRegistrationOptions(req, res) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: student.username,
      userDisplayName: student.name,
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // use the device's built-in sensor (not a separate USB key)
        userVerification: 'required'
      }
    });

    pendingChallenges.set(studentId, options.challenge);
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== STEP 2 of enrollment: verify the browser's response and save the credential =====
async function verifyRegistration(req, res) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const expectedChallenge = pendingChallenges.get(studentId);
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'No pending enrollment found. Please try again.' });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID
    });

    if (!verification.verified) {
      return res.status(400).json({ message: 'Fingerprint enrollment could not be verified.' });
    }

    student.fingerprintCredential = {
      credentialId: verification.registrationInfo.credentialID,
      publicKey: verification.registrationInfo.credentialPublicKey,
      counter: verification.registrationInfo.counter
    };
    await student.save();
    pendingChallenges.delete(studentId);

    res.json({ message: 'Fingerprint enrolled successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== STEP 1 of daily attendance verification: generate options =====
async function getAuthenticationOptions(req, res) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student || !student.fingerprintCredential) {
      return res.status(404).json({ message: 'No fingerprint enrolled for this student.' });
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: [{
        id: student.fingerprintCredential.credentialId,
        type: 'public-key'
      }],
      userVerification: 'required'
    });

    pendingChallenges.set(`auth_${studentId}`, options.challenge);
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== STEP 2 of daily attendance verification: verify the fingerprint touch =====
async function verifyAuthentication(req, res) {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student || !student.fingerprintCredential) {
      return res.status(404).json({ message: 'No fingerprint enrolled for this student.' });
    }

    const expectedChallenge = pendingChallenges.get(`auth_${studentId}`);
    if (!expectedChallenge) {
      return res.status(400).json({ message: 'No pending verification found. Please try again.' });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: student.fingerprintCredential.credentialId,
        credentialPublicKey: student.fingerprintCredential.publicKey,
        counter: student.fingerprintCredential.counter
      }
    });

    if (!verification.verified) {
      return res.status(400).json({ verified: false, message: 'Fingerprint did not match.' });
    }

    student.fingerprintCredential.counter = verification.authenticationInfo.newCounter;
    await student.save();
    pendingChallenges.delete(`auth_${studentId}`);

    res.json({ verified: true, message: 'Fingerprint confirmed.' });
  } catch (error) {
    res.status(500).json({ verified: false, message: 'Server error', error: error.message });
  }
}

module.exports = {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication
};
