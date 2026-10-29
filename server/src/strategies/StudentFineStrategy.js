const FineStrategy = require('./FineStrategy');

/**
 * StudentFineStrategy — base policy for students: 10 BDT per overdue day.
 *
 * Examples:
 *   0 days -> 0 BDT
 *   1 day  -> 10 BDT
 *   5 days -> 50 BDT
 */
class StudentFineStrategy extends FineStrategy {
  constructor(perDayRate = 10) {
    super();
    this.perDayRate = perDayRate;
  }

  calculateFine(overdueDays) {
    const days = Number(overdueDays);
    if (!Number.isInteger(days) || days < 0) {
      throw new Error('overdueDays must be a non-negative whole number');
    }
    return days * this.perDayRate;
  }
}

module.exports = StudentFineStrategy;
