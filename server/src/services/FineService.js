const StudentFineStrategy = require('../strategies/StudentFineStrategy');
const FacultyFineStrategy = require('../strategies/FacultyFineStrategy');
const OverdueHeavyFineStrategy = require('../strategies/OverdueHeavyFineStrategy');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HEAVY_THRESHOLD_DAYS = 7;
const HEAVY_RATE_BDT = 20;

/**
 * FineService — selects the correct fine-calculation Strategy for a member
 * role and converts dates into whole overdue days.
 *
 * Documented fine policy:
 *   Student : 10 BDT/day; after the first 7 overdue days, 20 BDT/day
 *   Faculty : 0 BDT always
 *   Librarian : 0 BDT always (librarians are staff and do not borrow)
 */
class FineService {
  /**
   * Picks the strategy for a role. Students additionally receive the
   * heavy-overdue decorator; other roles use their base strategy only.
   */
  getStrategyForRole(role) {
    switch (role) {
      case 'Student':
        return new OverdueHeavyFineStrategy(
          new StudentFineStrategy(10),
          HEAVY_THRESHOLD_DAYS,
          HEAVY_RATE_BDT
        );
      case 'Faculty':
        return new FacultyFineStrategy();
      case 'Librarian':
        return new FacultyFineStrategy();
      default:
        throw new Error(`Unknown member role: ${role}`);
    }
  }

  /**
   * Whole days between dueDate and atDate, never negative.
   * A book returned on or before the due date has 0 overdue days.
   */
  computeOverdueDays(dueDate, atDate = new Date()) {
    const due = new Date(dueDate).getTime();
    const at = new Date(atDate).getTime();
    if (Number.isNaN(due) || Number.isNaN(at)) {
      throw new Error('dueDate and atDate must be valid dates');
    }
    if (at <= due) return 0;
    return Math.floor((at - due) / MS_PER_DAY);
  }

  /** Calculates the fine in BDT for a role + overdue-day count. */
  calculateFine(role, overdueDays) {
    const strategy = this.getStrategyForRole(role);
    return strategy.calculateFine(overdueDays);
  }
}

FineService.HEAVY_THRESHOLD_DAYS = HEAVY_THRESHOLD_DAYS;
FineService.HEAVY_RATE_BDT = HEAVY_RATE_BDT;

module.exports = FineService;
