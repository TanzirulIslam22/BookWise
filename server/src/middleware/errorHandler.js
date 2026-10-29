const ApiError = require('../utils/ApiError');

/**
 * Centralised error handler. Every controller can simply throw or forward an
 * error; this middleware turns it into one consistent JSON response:
 *   { "success": false, "message": "..." }
 * Database and unexpected errors are logged and returned as 500 without
 * leaking internals (credentials, stack traces, etc.).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join('; ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid value for ${err.path}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res
      .status(409)
      .json({ success: false, message: `Duplicate value for ${field}: it must be unique` });
  }

  console.error('Unhandled error:', err.message);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

/** Wraps async route handlers so rejected promises reach errorHandler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };
