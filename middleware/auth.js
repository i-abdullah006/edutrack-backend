// This middleware checks whether the request is coming from a logged-in user,
// and also checks whether that user is an admin or a student

const jwt = require('jsonwebtoken');

// Allows any logged-in user (admin or student)
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // extract token from "Bearer TOKEN" format

  if (!token) {
    return res.status(401).json({ message: 'Login required. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
    }
    req.user = decoded; // { id, role: 'admin' or 'student' }
    next();
  });
}

// Allows admin only
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only an admin can access this.' });
  }
  next();
}

module.exports = { verifyToken, requireAdmin };
