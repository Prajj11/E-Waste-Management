export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * Wrap async route handlers so thrown errors reach the error middleware
 */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * 404 Not Found handler
 */
export function notFound(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

/**
 * Central Express error handler for HTTP, MongoDB, and Mongoose errors
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Explicit custom HTTP errors
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  // MongoDB unique index conflict (code 11000)
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    const fieldName = keys.length ? keys.join(', ') : 'field';
    return res.status(409).json({
      message: `A record with that ${fieldName} already exists`,
    });
  }

  // Mongoose invalid ObjectId / CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ID format for ${err.path || 'identifier'}`,
    });
  }

  // Mongoose schema validation failure
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      message: messages[0] || 'Validation error',
    });
  }

  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}
