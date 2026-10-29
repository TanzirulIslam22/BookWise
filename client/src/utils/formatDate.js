/**
 * Date helpers that display dates in the viewer's LOCAL time zone.
 * (Using toISOString().slice(0, 10) shows the UTC date, which can be one
 * day off for users east or west of Greenwich.)
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** True when an active borrowing's due date is in the past. */
export function isOverdue(dueDate, now = Date.now()) {
  if (!dueDate) return false;
  return new Date(dueDate).getTime() < now;
}
