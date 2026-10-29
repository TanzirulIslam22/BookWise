/**
 * FineStrategy — abstract base for the Strategy (behavioural) design pattern.
 *
 * Every concrete strategy implements the same interface:
 *     calculateFine(overdueDays) -> number (BDT, never negative)
 *
 * The FineService picks the strategy that matches a member's role, so the
 * calculation rule can be swapped without changing the calling code.
 */
class FineStrategy {
  /**
   * @param {number} overdueDays whole number of overdue days (>= 0)
   * @returns {number} fine amount in BDT
   */
  calculateFine(overdueDays) {
    throw new Error('Concrete strategies must implement calculateFine()');
  }
}

module.exports = FineStrategy;
