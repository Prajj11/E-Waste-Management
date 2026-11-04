import jwt from 'jsonwebtoken';

export const signToken = (user) => {
  const id = user.id ? user.id.toString() : user._id ? user._id.toString() : null;
  return jwt.sign(
    { id, role: user.role },
    process.env.JWT_SECRET || 'ecocycle-jwt-fallback-secret-key-change-in-env',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

/**
 * Requires a valid "Authorization: Bearer <token>" header and sets req.user = { id, role }
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ message: 'Please log in' });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'ecocycle-jwt-fallback-secret-key-change-in-env'
    );
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
}

/**
 * Ensures req.user has one of the allowed roles
 */
export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: 'You do not have access to this resource' });
