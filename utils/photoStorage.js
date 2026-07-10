// Handles saving student photos (either a live camera capture sent as a
// base64 data URL, or a regular file upload) to disk, and serving them back.
//
// Photos are stored under /uploads/students/<studentId or temp-id>.<ext>
// and served statically by server.js at the /uploads path.

const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'students');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Accepts a base64 data URL (e.g. "data:image/jpeg;base64,...") from a live
// camera capture in the browser, and saves it as a file. Returns the public
// URL path to store on the student record.
function saveBase64Photo(dataUrl, identifier) {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid image data.');
  }

  const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const base64Data = matches[2];
  const filename = `${identifier}_${Date.now()}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  fs.writeFileSync(filePath, base64Data, 'base64');

  return `/uploads/students/${filename}`;
}

// Deletes a previously saved photo file, given its stored public URL path.
// Safe to call even if the file doesn't exist - it will just be a no-op.
function deletePhotoFile(photoUrl) {
  if (!photoUrl) return;
  const filename = path.basename(photoUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.unlink(filePath, () => {}); // ignore errors - file may already be gone
}

module.exports = { saveBase64Photo, deletePhotoFile, UPLOAD_DIR };
