// Central curriculum reference data.
// This defines every class -> stream -> subgroup -> subject combination used
// when adding a student, and is also used to validate marks entries.
//
// The Islamiat/Pak Studies pattern is controlled separately via Settings
// (combinedIslamiatPakStudiesMatric / combinedIslamiatPakStudiesIntermediate),
// NOT hardcoded here, since it varies by academic year/board policy and can
// differ between Matric and Intermediate levels.

// ===== CLASSES 9 & 10 (Matric) =====
const MATRIC_STREAMS = {
  science: {
    label: 'Science',
    fixedSubjects: ['Physics', 'Chemistry'],
    choice: {
      label: 'Choose one',
      options: ['Biology', 'Computer Science']
    },
    subGroups: null
  },
  tech: {
    label: 'Tech',
    fixedSubjects: [],
    choice: null,
    subGroups: {
      health_sciences: {
        label: 'Health Sciences',
        subjects: ['Physics (Tech)', 'Chemistry (Tech)', 'Biology (Tech)', 'Health Sciences']
      },
      agriculture: {
        label: 'Agriculture Sciences',
        subjects: ['Physics (Tech)', 'Chemistry (Tech)', 'Biology (Tech)', 'Agriculture Sciences']
      },
      fashion_designing: {
        label: 'Fashion Designing',
        subjects: ['General Science (Tech)', 'Computer Science & Entrepreneurship (Tech)', 'Communication Skills & Personal Grooming', 'Fashion Designing']
      },
      computer_science: {
        label: 'Computer Science',
        subjects: ['Physics (Tech)', 'Chemistry (Tech)', 'Computer Science & Entrepreneurship (Tech)', 'Information & Communication Technology (ICT)']
      }
    }
  }
};

const MATRIC_COMPULSORY = ['Urdu', 'English', 'Mathematics']; // Islamiat/Pak Studies added dynamically

// ===== CLASSES 11 & 12 (Intermediate) =====
const INTER_GROUPS = {
  fsc: {
    label: 'F.Sc',
    fixedSubjects: [],
    choice: null,
    subGroups: {
      pre_engineering: {
        label: 'Pre-Engineering',
        subjects: ['Mathematics', 'Physics', 'Chemistry']
      },
      pre_medical: {
        label: 'Pre-Medical',
        subjects: ['Biology', 'Physics', 'Chemistry']
      }
    }
  },
  ics: {
    label: 'ICS',
    fixedSubjects: [],
    choice: null,
    subGroups: {
      group_1: {
        label: 'Physics, Mathematics & Computer Science',
        subjects: ['Physics', 'Mathematics', 'Computer Science']
      },
      group_2: {
        label: 'Statistics, Mathematics & Computer Science',
        subjects: ['Statistics', 'Mathematics', 'Computer Science']
      },
      group_3: {
        label: 'Statistics, Economics & Computer Science',
        subjects: ['Statistics', 'Economics', 'Computer Science']
      }
    }
  }
};

const INTER_COMPULSORY = ['Urdu', 'English']; // Islamiat/Pak Studies added dynamically

// ===== Helper: build the Islamiat/Pak Studies subjects for a class, based on the school's setting =====
// combinedMode = true  -> the lower class of the pair gets "Islamiat" only (covers both years' syllabus),
//                         the upper class gets "Pakistan Studies" only (covers both years' syllabus)
// combinedMode = false -> Both Islamiat AND Pakistan Studies appear as separate subjects in that class
// Matric (9/10) and Intermediate (11/12) have their own independent setting,
// since the board's policy for each level can differ.
function getIslamiatPakStudiesSubjects(classNumber, combinedMatric, combinedIntermediate) {
  if (classNumber === 9) return combinedMatric ? ['Islamiat'] : ['Islamiat', 'Pakistan Studies'];
  if (classNumber === 10) return combinedMatric ? ['Pakistan Studies'] : ['Islamiat', 'Pakistan Studies'];
  if (classNumber === 11) return combinedIntermediate ? ['Islamiat'] : ['Islamiat', 'Pakistan Studies'];
  if (classNumber === 12) return combinedIntermediate ? ['Pakistan Studies'] : ['Islamiat', 'Pakistan Studies'];
  return [];
}

// ===== Main function: given a student's class/stream/subgroup/elective choice, return their full subject list =====
function resolveSubjects({ classNumber, stream, subGroup, elective, combinedIslamiatPakStudiesMatric, combinedIslamiatPakStudiesIntermediate }) {
  const religionCivics = getIslamiatPakStudiesSubjects(classNumber, combinedIslamiatPakStudiesMatric, combinedIslamiatPakStudiesIntermediate);

  if (classNumber === 9 || classNumber === 10) {
    const compulsory = [...MATRIC_COMPULSORY, ...religionCivics];

    if (stream === 'science') {
      const scienceConfig = MATRIC_STREAMS.science;
      const electiveSubject = elective; // 'Biology' or 'Computer Science'
      return [...compulsory, ...scienceConfig.fixedSubjects, electiveSubject].filter(Boolean);
    }

    if (stream === 'tech') {
      const subGroupConfig = MATRIC_STREAMS.tech.subGroups[subGroup];
      if (!subGroupConfig) return compulsory;
      return [...compulsory, ...subGroupConfig.subjects];
    }

    return compulsory;
  }

  if (classNumber === 11 || classNumber === 12) {
    const compulsory = [...INTER_COMPULSORY, ...religionCivics];

    if (stream === 'fsc' || stream === 'ics') {
      const groupConfig = INTER_GROUPS[stream].subGroups[subGroup];
      if (!groupConfig) return compulsory;
      return [...compulsory, ...groupConfig.subjects];
    }

    return compulsory;
  }

  return [];
}

module.exports = {
  MATRIC_STREAMS,
  MATRIC_COMPULSORY,
  INTER_GROUPS,
  INTER_COMPULSORY,
  getIslamiatPakStudiesSubjects,
  resolveSubjects
};
