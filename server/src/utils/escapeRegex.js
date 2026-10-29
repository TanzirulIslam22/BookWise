/**
 * Escapes regular-expression metacharacters in user-supplied search text.
 *
 * Search endpoints build case-insensitive `$regex` filters from whatever the
 * user types. Without escaping, a query like "(" or "C++" becomes an invalid
 * regular expression and MongoDB rejects the whole request (HTTP 500).
 * Escaping makes every literal character safe to search for.
 */
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegex;
