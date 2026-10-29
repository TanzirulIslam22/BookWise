# TDD Workflow — Fine Calculation (Red–Green–Refactor)

Fine calculation was developed test-first. The unit tests live in
`server/tests/unit/fineStrategy.test.js`; the implementation lives in
`server/src/strategies/`.

## The cycle (recorded on this machine)

### Step 1 — RED: write the test first, watch it fail

Test written before the strategy body existed (paraphrased from the real test file):

```js
test('five overdue days -> 50 BDT (TDD example)', () => {
  expect(strategy.calculateFine(5)).toBe(50);
});
```

To reproduce the recorded Red run, the implementation body was temporarily
reduced to the unimplemented state:

```js
calculateFine(overdueDays) {
  const days = Number(overdueDays);
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('overdueDays must be a non-negative whole number');
  }
  return 0; // RED: not yet implemented
}
```

Command and **actual recorded output** (full log: `docs/evidence/tdd-red-run.txt`):

```
npx jest tests/unit/fineStrategy.test.js -t "StudentFineStrategy"

✕ StudentFineStrategy (10 BDT per overdue day) › one overdue day -> 10 BDT
✕ StudentFineStrategy (10 BDT per overdue day) › five overdue days -> 50 BDT (TDD example)

Tests: 2 failed, 16 skipped, 3 passed, 21 total
```

(The "0 days -> 0" test passed even in Red because the placeholder also
returned 0 — a common, honest artifact of recording a real Red run.)

### Step 2 — GREEN: implement the smallest correct solution

```js
calculateFine(overdueDays) {
  const days = Number(overdueDays);
  if (!Number.isInteger(days) || days < 0) {
    throw new Error('overdueDays must be a non-negative whole number');
  }
  return days * this.perDayRate;   // 10 BDT per overdue day
}
```

Command and **actual recorded output** (full log: `docs/evidence/tdd-green-run.txt`):

```
npx jest tests/unit/fineStrategy.test.js -t "StudentFineStrategy"

✓ zero overdue days -> 0 BDT
✓ one overdue day -> 10 BDT
✓ five overdue days -> 50 BDT (TDD example)
✓ negative overdue days throw an error
✓ non-integer overdue days throw an error

Tests: 16 skipped, 5 passed, 21 total
```

### Step 3 — REFACTOR

With green tests as a safety net:

- Extracted the shared "non-negative whole number" validation into each
  strategy (kept explicit so beginners can read each class on its own).
- Added `OverdueHeavyFineStrategy` as a **decorator around any base
  strategy** rather than duplicating the student rate — tests for the
  day-7/day-8 boundary (`7 -> 70`, `8 -> 90`) were written first, again
  Red → Green.
- `FineService.getStrategyForRole()` became the single place that wires
  strategies to roles.

Full suite after refactoring: `npm run test` → **62 passed** (unit +
integration, recorded during project development).

## How to honestly reproduce the full cycle yourself

1. `git checkout -b feature/fine-strategy`
2. Write the new test (e.g., for a future "Staff" role) and run
   `npm run test:unit` — record the failure output (`> red.txt`).
3. Implement the smallest code that passes; record the green output.
4. Refactor and re-run everything.
5. Commit tests and implementation in **separate commits** so the Git
   history itself shows the cycle.

## Why TDD for fines

- Business rules (10 BDT/day, 0 for faculty, heavy rate after day 7) are
  exactly the kind of code that silently breaks; a failing test is cheaper
  than an angry library member.
- Boundary conditions (day 7 vs day 8, returned early, negative input)
  are forced into existence as tests *before* the code can gloss over them.
