// Admin controls class start time, late cutoff, today's attendance method,
// the Islamiat/Pak Studies pattern, and the secret password here.

const bcrypt = require('bcryptjs');
const Settings = require('../models/Settings');
const Admin = require('../models/Admin');

async function getOrCreateSettings() {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

// ===== GET SETTINGS =====
// Never sends back secretPasswordHash - only whether one has been set yet.
async function getSettings(req, res) {
  try {
    const settings = await getOrCreateSettings();
    const settingsObj = settings.toObject();
    const hasSecretPassword = !!settingsObj.secretPasswordHash;
    delete settingsObj.secretPasswordHash;

    res.json({ ...settingsObj, hasSecretPassword });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== UPDATE GENERAL SETTINGS =====
async function updateSettings(req, res) {
  try {
    const { classStartTime, lateCutoffMinutes, todaysMethod, combinedIslamiatPakStudiesMatric, combinedIslamiatPakStudiesIntermediate } = req.body;

    const settings = await getOrCreateSettings();

    if (classStartTime !== undefined) settings.classStartTime = classStartTime;
    if (lateCutoffMinutes !== undefined) settings.lateCutoffMinutes = lateCutoffMinutes;
    if (todaysMethod !== undefined) settings.todaysMethod = todaysMethod;
    if (combinedIslamiatPakStudiesMatric !== undefined) settings.combinedIslamiatPakStudiesMatric = combinedIslamiatPakStudiesMatric;
    if (combinedIslamiatPakStudiesIntermediate !== undefined) settings.combinedIslamiatPakStudiesIntermediate = combinedIslamiatPakStudiesIntermediate;

    await settings.save();

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== SET THE SECRET PASSWORD (first time, or to change it) =====
// This itself requires the CURRENT secret password to change, once one exists -
// otherwise anyone with admin access could silently swap it out.
async function setSecretPassword(req, res) {
  try {
    const { currentSecretPassword, newSecretPassword } = req.body;

    if (!newSecretPassword || newSecretPassword.length < 6) {
      return res.status(400).json({ message: 'New secret password must be at least 6 characters long.' });
    }

    const settings = await getOrCreateSettings();

    if (settings.secretPasswordHash) {
      if (!currentSecretPassword) {
        return res.status(400).json({ message: 'Current secret password is required to change it.' });
      }
      const isMatch = await bcrypt.compare(currentSecretPassword, settings.secretPasswordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current secret password is incorrect.' });
      }
    }

    settings.secretPasswordHash = await bcrypt.hash(newSecretPassword, 10);
    await settings.save();

    res.json({ message: 'Secret password set successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== CHANGE ADMIN LOGIN PASSWORD (requires the SECRET password, not the current login password) =====
// This is intentional: if the admin login password is ever shared temporarily
// with someone else, they cannot change it unless they also know the
// separate secret password.
async function changeAdminPassword(req, res) {
  try {
    const { secretPassword, newPassword } = req.body;

    if (!secretPassword || !newPassword) {
      return res.status(400).json({ message: 'Secret password and new password are both required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const settings = await getOrCreateSettings();
    if (!settings.secretPasswordHash) {
      return res.status(400).json({ message: 'No secret password has been set yet. Please set one first in Settings.' });
    }

    const secretMatch = await bcrypt.compare(secretPassword, settings.secretPasswordHash);
    if (!secretMatch) {
      return res.status(401).json({ message: 'Secret password is incorrect.' });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found.' });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ message: 'Admin password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = { getSettings, updateSettings, setSecretPassword, changeAdminPassword };
