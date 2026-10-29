const FineStrategy = require('./FineStrategy');

/**
 * FacultyFinePolicy — faculty members are never charged an overdue fine.
 * The method still validates its input so callers cannot pass nonsense.
 */
class FacultyFineStrategy extends FineStrategy {
  calculateFine(overdueDays) {
    const days = Number(overdueDays);
    if (!Number.isInteger(days) || days < 0) {
      throw new Error('overdueDays must be a non-negative whole number');
    }
    return 0;
  }
}

module.exports = FacultyFineStrategy;
