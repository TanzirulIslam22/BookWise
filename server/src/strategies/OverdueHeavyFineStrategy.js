const FineStrategy = require('./FineStrategy');

/**
 * OverdueHeavyFineStrategy — heavy-overdue policy decorator.
 *
 * Rule (documented boundary conditions):
 *   - The first `threshold` overdue days use the wrapped base strategy.
 *   - Every additional day beyond the threshold is charged `heavyRate` BDT.
 *
 * With the default threshold = 7 and heavyRate = 20 (and a student base rate
 * of 10 BDT/day):
 *   day 1..7  -> 10 BDT each  (total 70 at day 7)
 *   day 8     -> 70 + 20 = 90 BDT
 *   day 10    -> 70 + 3*20 = 130 BDT
 */
class OverdueHeavyFineStrategy extends FineStrategy {
  constructor(baseStrategy, threshold = 7, heavyRate = 20) {
    super();
    if (!baseStrategy || typeof baseStrategy.calculateFine !== 'function') {
      throw new Error('OverdueHeavyFineStrategy requires a base strategy');
    }
    this.baseStrategy = baseStrategy;
    this.threshold = threshold;
    this.heavyRate = heavyRate;
  }

  calculateFine(overdueDays) {
    const days = Number(overdueDays);
    if (!Number.isInteger(days) || days < 0) {
      throw new Error('overdueDays must be a non-negative whole number');
    }
    if (days <= this.threshold) {
      return this.baseStrategy.calculateFine(days);
    }
    const basePart = this.baseStrategy.calculateFine(this.threshold);
    const extraDays = days - this.threshold;
    return basePart + extraDays * this.heavyRate;
  }
}

module.exports = OverdueHeavyFineStrategy;
