# Five-Minute Live Demo Plan & Viva Preparation

## Pre-demo command checklist (run ~15 minutes before)

```bash
# 1. All tests green?
cd server && npm test          # expect: 68 passed
npm run test:coverage          # note the percentages for the report

# 2. Backend up (demo mode needs no MongoDB)
npm run start:memory:seed      # in-memory DB pre-filled with demo data
# or: npm run seed && npm start   (seeds + serves the real MongoDB in .env)

# 3. Frontend built + served
cd ../client && npm run build && npm run preview   # http://localhost:4173

# 4. Login works?
# open http://localhost:4173 -> log in as librarian / bookwise123

# 5. Swagger reachable?
# open http://localhost:5000/api-docs

# 6. Optional full E2E check
cd ../e2e && npm test          # expect: E2E TEST PASSED

# 7. Git evidence ready
# git log --oneline --graph --all, PR pages open in browser tabs
```

## 5-minute demo script

| Time | Action | Talking point |
|------|--------|---------------|
| 0:00–0:30 | Login + show repo architecture | "Single librarian login gate (server-verified); MERN library system; five modules; Singleton DB manager, Facade for issue/return, Strategy for fines." |
| 0:30–1:00 | Dashboard + Book Catalog | "Live numbers from Mongo through the REST API — seeded demo data." |
| 1:00–1:30 | Add a member (Members page) | "Unique member ID enforced; toast confirms; audit event created." |
| 1:30–2:15 | Issue a book (Issue/Return page) | "Facade validates member, limit, availability; due date +14 days; availability drops in catalog." |
| 2:15–3:00 | Fines page — live overdue list | "Seeded demo data already has overdue records: student 3 days → 30 BDT, student 9 days → 110 BDT (heavy rule), faculty overdue → 0 BDT. Live totals update as time passes." |
| 3:00–3:30 | Return book → show toast with fine / "No fine" | "Fine policy: Student 10/day, heavy 20/day after day 7, Faculty 0." |
| 3:30–4:00 | Audit History page | "Every operation persisted: issue, return, fine, overdue." |
| 4:00–4:30 | Swagger UI — run GET /api/books (Try it out) | "Self-learned tool; docs generated from one OpenAPI file." |
| 4:30–5:00 | Show `npm test` output + Actions tab | "64 tests; mocking in facade unit tests; CI runs unit+integration+build(+e2e)." |

If time is cut short: drop the Swagger step and the coverage numbers; keep
the issue→return→audit workflow.

## Likely viva questions and concise answers

**Why the Incremental model?** The five modules are independent slices; each
increment is implemented, tested and demoed before the next, so problems stay
small and progress is always demonstrable.

**What does the Singleton guarantee?** One shared `DatabaseManager` instance
owning the connection lifecycle for the whole process — not one socket and not
an automatic speed-up; the driver already pools connections.

**Why Facade for borrow/return?** Issue/return touch member lookup, limits,
stock, records and audit. The facade exposes `issueBook()`/`returnBook()` so
controllers stay thin and tests can mock the collaborators.

**Why not Adapter?** Adapter converts one interface to another; here there is
no incompatible third-party interface — we orchestrate *our own* components.

**Why Strategy for fines?** Policies differ by role and will change; each rule
is its own class with the same `calculateFine(days)` interface, so adding a
new policy = adding one file (open/closed).

**Why not State?** State models an object whose *behaviour changes with its
internal state*; fines are a family of interchangeable algorithms chosen by
role, which is Strategy's definition.

**Red–Green–Refactor?** Write a failing test first (Red), write the minimal
code to pass (Green), improve structure with tests still green (Refactor).
Evidence: `docs/tdd-workflow.md` with real captured output.

**Mocking vs integration tests?** Unit tests mock repositories/audit service
to test the facade's decisions in isolation and fast; integration tests use
real Express + real (in-memory) MongoDB to verify the whole HTTP path.

**What does coverage not tell you?** It counts executed code, not correctness.
73% branch coverage means untested if/else paths remain (e.g. some error
handler branches).

**How does CI help?** Every push re-runs tests/build/e2e so regressions are
caught before merging; logs show exactly which step failed.

**Why Swagger/OpenAPI?** One spec file generates interactive docs and can
validate requests; better than a README (which drifts) and shareable unlike
a personal Postman collection.

**How do you know available copies never go negative?** Atomic conditional
update (`availableCopies: {$gt:0}` with `$inc: -1`) + schema validation +
unit/integration tests.

**What are the limitations?** No auth, no payments, no pagination, regex
search, no multi-document transactions (documented atomic-update alternative).

## Honest-evidence reminders

- Only claim CI is green if the Actions run actually succeeded on GitHub.
- Only paste coverage/test numbers you have run yourself at submission time.
- Screenshots must be of *your* running app (add them under `docs/screenshots/`).
