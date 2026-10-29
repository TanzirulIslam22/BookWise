/**
 * Tiny request-validation middleware (no extra dependency).
 * Usage: router.post('/', validateBody({ name: 'required' }), controller)
 */
function validateBody(rules) {
  return (req, res, next) => {
    const body = req.body || {};
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = body[field];
      if (rule.includes('required') && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      if (value === undefined || value === null || value === '') continue;

      if (rule.includes('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        errors.push(`${field} must be a valid email address`);
      }
      if (rule.includes('role') && !['Student', 'Faculty', 'Librarian'].includes(value)) {
        errors.push(`${field} must be Student, Faculty or Librarian`);
      }
      if (rule.includes('positiveInt')) {
        const num = Number(value);
        if (!Number.isInteger(num) || num < 1) {
          errors.push(`${field} must be a whole number of at least 1`);
        }
      }
      if (rule.includes('string')) {
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join('; ') });
    }
    return next();
  };
}

module.exports = validateBody;
