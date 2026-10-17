export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Wrap async route handlers so thrown errors reach the error middleware */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function notFound(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.status) return res.status(err.status).json({ message: err.message });
  // Oracle constraint errors -> friendly messages
  if (err.errorNum === 1) return res.status(409).json({ message: 'That record already exists' });
  if (err.errorNum === 2292) return res.status(409).json({ message: 'Cannot delete: other records depend on this one' });
  if (err.errorNum === 2290) return res.status(400).json({ message: 'A value violates a database rule' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}
