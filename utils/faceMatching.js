// Face matching logic.
//
// Important: the actual face DETECTION and DESCRIPTOR EXTRACTION happens in
// the browser using face-api.js (it needs a camera and canvas, which only
// exist client-side). This file only handles the MATH of comparing two
// already-computed descriptors (arrays of numbers) to decide if they
// represent the same person.
//
// A face descriptor is a 128-number vector. Two descriptors of the same
// person's face will have a small "Euclidean distance" between them; two
// different people's faces will have a larger distance. We use a
// conservative threshold - as agreed, it's better to under-match (fall back
// to manual) than to wrongly mark the wrong student present.

const MATCH_THRESHOLD = 0.5; // lower = stricter. face-api.js's own docs suggest ~0.6 as a typical cutoff;
                              // we use a slightly stricter 0.5 to reduce false positives, favoring manual fallback

function euclideanDistance(descriptorA, descriptorB) {
  if (!descriptorA || !descriptorB || descriptorA.length !== descriptorB.length) {
    return Infinity;
  }
  let sum = 0;
  for (let i = 0; i < descriptorA.length; i++) {
    const diff = descriptorA[i] - descriptorB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Given a scanned face descriptor and a list of {studentId, descriptor} pairs,
// find the closest match. Returns { studentId, distance } if within threshold,
// or null if no student is a confident enough match.
function findBestMatch(scannedDescriptor, studentDescriptors) {
  let best = null;

  for (const entry of studentDescriptors) {
    if (!entry.descriptor) continue;
    const distance = euclideanDistance(scannedDescriptor, entry.descriptor);
    if (distance < MATCH_THRESHOLD && (!best || distance < best.distance)) {
      best = { studentId: entry.studentId, distance };
    }
  }

  return best;
}

module.exports = { findBestMatch, euclideanDistance, MATCH_THRESHOLD };
