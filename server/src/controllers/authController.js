const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/config');

/** Constant-time string comparison so the check cannot be timed. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * AuthController — single-operator login gate.
 *
 * The assignment scopes out full authentication/authorization; this endpoint
 * verifies ONE librarian/admin account (configured through ADMIN_USERNAME and
 * ADMIN_PASSWORD in the environment) so the web UI can be restricted to the
 * library operator. Credentials are checked on the server and never stored in
 * or served to the client.
 */
function authController() {
  return {
    /** POST /api/auth/login — verify the librarian/admin credentials. */
    login: asyncHandler(async (req, res) => {
      const { username = '', password = '' } = req.body || {};

      if (!String(username).trim() || !String(password).trim()) {
        throw new ApiError(400, 'username and password are required');
      }

      const userOk = safeEqual(username, config.adminUsername);
      const passOk = safeEqual(password, config.adminPassword);

      if (!userOk || !passOk) {
        throw new ApiError(401, 'Invalid username or password');
      }

      res.json({
        success: true,
        message: `Welcome back, ${config.adminUsername}`,
        data: { username: config.adminUsername, role: 'Librarian' },
      });
    }),
  };
}

module.exports = authController;
