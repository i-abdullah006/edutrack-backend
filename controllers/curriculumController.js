// Exposes the curriculum structure (classes, streams, subgroups, subjects) to the frontend
// so the student-add form can build its cascading dropdowns.

const { MATRIC_STREAMS, INTER_GROUPS, resolveSubjects } = require('../utils/curriculum');
const Settings = require('../models/Settings');

// ===== GET FULL CURRICULUM STRUCTURE (for building dropdowns) =====
async function getCurriculumStructure(req, res) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json({
      matric: {
        streams: MATRIC_STREAMS
      },
      intermediate: {
        groups: INTER_GROUPS
      },
      combinedIslamiatPakStudiesMatric: settings.combinedIslamiatPakStudiesMatric,
      combinedIslamiatPakStudiesIntermediate: settings.combinedIslamiatPakStudiesIntermediate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ===== RESOLVE SUBJECTS FOR A GIVEN COMBINATION (used by the add-student form to preview) =====
async function previewSubjects(req, res) {
  try {
    const { classNumber, stream, subGroup, elective } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    const subjects = resolveSubjects({
      classNumber: Number(classNumber),
      stream,
      subGroup,
      elective,
      combinedIslamiatPakStudiesMatric: settings.combinedIslamiatPakStudiesMatric,
      combinedIslamiatPakStudiesIntermediate: settings.combinedIslamiatPakStudiesIntermediate
    });

    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = { getCurriculumStructure, previewSubjects };
