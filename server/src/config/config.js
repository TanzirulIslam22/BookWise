require('dotenv').config();

/**
 * Reads configuration from environment variables with safe defaults for
 * local development. Real credentials must never be committed to Git —
 * they belong in a local .env file (see .env.example).
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_library',
  mongoUriTest: process.env.MONGODB_URI_TEST || '',
  loanPeriodDays: Number(process.env.LOAN_PERIOD_DAYS) || 14,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  // Single-operator login gate (see /api/auth/login). Defaults exist so the
  // demo, tests and CI work out of the box — override them in .env.
  adminUsername: process.env.ADMIN_USERNAME || 'librarian',
  adminPassword: process.env.ADMIN_PASSWORD || 'bookwise123',
};

module.exports = config;
