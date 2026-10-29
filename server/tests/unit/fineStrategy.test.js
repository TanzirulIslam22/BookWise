/**
 * Unit tests for the Strategy pattern fine-calculation rules.
 *
 * These tests are the ones used for the Red-Green-Refactor TDD demonstration
 * on fine calculation. See docs/tdd-workflow.md for the recorded cycle and
 * instructions on how to reproduce the "Red" state honestly.
 */
const StudentFineStrategy = require('../../src/strategies/StudentFineStrategy');
const FacultyFineStrategy = require('../../src/strategies/FacultyFineStrategy');
const OverdueHeavyFineStrategy = require('../../src/strategies/OverdueHeavyFineStrategy');
const FineService = require('../../src/services/FineService');

describe('StudentFineStrategy (10 BDT per overdue day)', () => {
  const strategy = new StudentFineStrategy(10);

  test('zero overdue days -> 0 BDT', () => {
    expect(strategy.calculateFine(0)).toBe(0);
  });

  test('one overdue day -> 10 BDT', () => {
    expect(strategy.calculateFine(1)).toBe(10);
  });

  test('five overdue days -> 50 BDT (TDD example)', () => {
    expect(strategy.calculateFine(5)).toBe(50);
  });

  test('negative overdue days throw an error', () => {
    expect(() => strategy.calculateFine(-1)).toThrow('non-negative whole number');
  });

  test('non-integer overdue days throw an error', () => {
    expect(() => strategy.calculateFine(2.5)).toThrow('non-negative whole number');
  });
});

describe('FacultyFineStrategy (0 BDT always)', () => {
  const strategy = new FacultyFineStrategy();

  test('faculty never pays a fine', () => {
    expect(strategy.calculateFine(0)).toBe(0);
    expect(strategy.calculateFine(1)).toBe(0);
    expect(strategy.calculateFine(30)).toBe(0);
  });

  test('still rejects invalid input', () => {
    expect(() => strategy.calculateFine(-3)).toThrow('non-negative whole number');
  });
});

describe('OverdueHeavyFineStrategy (first 7 days base rate, then 20 BDT/day)', () => {
  const heavy = new OverdueHeavyFineStrategy(new StudentFineStrategy(10), 7, 20);

  test('days 1-7 use the base rate', () => {
    expect(heavy.calculateFine(3)).toBe(30);
    expect(heavy.calculateFine(7)).toBe(70);
  });

  test('day-eight boundary: 70 + 20 = 90 BDT', () => {
    expect(heavy.calculateFine(8)).toBe(90);
  });

  test('beyond day eight each day costs 20 BDT', () => {
    expect(heavy.calculateFine(10)).toBe(70 + 3 * 20); // 130
    expect(heavy.calculateFine(14)).toBe(70 + 7 * 20); // 210
  });

  test('zero days stays zero', () => {
    expect(heavy.calculateFine(0)).toBe(0);
  });

  test('requires a base strategy', () => {
    expect(() => new OverdueHeavyFineStrategy(null)).toThrow('requires a base strategy');
  });

  test('is interchangeable with the base interface', () => {
    const anyStrategy = new OverdueHeavyFineStrategy(new StudentFineStrategy(10));
    expect(typeof anyStrategy.calculateFine).toBe('function');
  });
});

describe('FineService (Strategy selection + date handling)', () => {
  const service = new FineService();

  test('selects the heavy-decorated strategy for students', () => {
    expect(service.calculateFine('Student', 5)).toBe(50);
    expect(service.calculateFine('Student', 8)).toBe(90);
  });

  test('selects zero fine for faculty', () => {
    expect(service.calculateFine('Faculty', 12)).toBe(0);
  });

  test('rejects unknown roles', () => {
    expect(() => service.calculateFine('Robot', 1)).toThrow('Unknown member role');
  });

  test('computeOverdueDays: returned on due date -> 0', () => {
    const due = new Date('2026-01-10T10:00:00Z');
    const at = new Date('2026-01-10T10:00:00Z');
    expect(service.computeOverdueDays(due, at)).toBe(0);
  });

  test('computeOverdueDays: before due date -> 0 (never negative)', () => {
    const due = new Date('2026-01-10T10:00:00Z');
    const at = new Date('2026-01-01T10:00:00Z');
    expect(service.computeOverdueDays(due, at)).toBe(0);
  });

  test('computeOverdueDays: partial days are truncated', () => {
    const due = new Date('2026-01-10T10:00:00Z');
    const at = new Date('2026-01-11T09:59:00Z'); // 23h59m later
    expect(service.computeOverdueDays(due, at)).toBe(0);
  });

  test('computeOverdueDays: five full days', () => {
    const due = new Date('2026-01-10T10:00:00Z');
    const at = new Date('2026-01-15T10:00:01Z');
    expect(service.computeOverdueDays(due, at)).toBe(5);
  });

  test('computeOverdueDays: invalid dates throw', () => {
    expect(() => service.computeOverdueDays('not-a-date')).toThrow('valid dates');
  });
});
