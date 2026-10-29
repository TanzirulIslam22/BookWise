# Reflection Essay (CO4, PO12) — 500–700 words

> **Instructions before submission:** items marked `[PERSONAL: …]` are
> placeholders that must be rewritten from your own real experience (or
> deleted). Do not submit the essay with these markers, and do not invent
> experiences to replace them. Current word count: ~620.

---

When I started this project, the goal was not to build the biggest library
system in the world, but to walk through a complete software engineering
process on a system small enough to understand end-to-end. The Smart Library
& Fine Management System uses the MERN stack — React with Tailwind CSS on the
front, Express and Mongoose with MongoDB behind a REST API — because it let me
keep one language (JavaScript) across the whole project and focus on
engineering practice rather than fighting tooling.

For the process model I chose the Incremental Model. The five modules —
members, books, borrow/return, fines, and audit — are naturally separable, so
I could finish and test each slice before starting the next. This suited a
single-developer sessional project: if something went wrong in the fine
policy, member registration was already stable and demonstrable.
`[PERSONAL: describe one real problem you hit in a specific increment and how
incremental delivery helped or did not help.]`

Three design patterns did real work in the code. The **Singleton**
`DatabaseManager` gives the process one shared connection manager, so the
connection lifecycle has a single owner. I rejected Prototype here because
cloning a database manager would make no sense — there is nothing useful to
copy. The **Facade** `BorrowFacade` hides the multi-step issue/return
workflow (member lookup, borrow limit, stock update, due date, fine
calculation, audit logging) behind two readable methods; I rejected Adapter
because no incompatible third-party interface needed translating. The
**Strategy** pattern implements the fine policies — 10 BDT/day for students,
0 for faculty, and a heavy-overdue decorator that charges 20 BDT/day after
the first seven days. I rejected State because the fine rules are
interchangeable algorithms selected by role, not an object whose behaviour
changes with internal state. `[PERSONAL: if you debated different patterns
during development, mention the real alternative you considered.]`

Test-Driven Development was applied most strictly to fine calculation. I
recorded a real Red–Green cycle in `docs/tdd-workflow.md`: the tests failed
against the unimplemented strategy, passed after the ten-taka-per-day rule,
and the boundary cases (day 7 = 70, day 8 = 90) were locked in with tests.
Mocking mattered in the facade unit tests: repositories, the fine service and
the audit service are all Jest mocks, so the tests verify coordination logic
without a database and run in milliseconds. Integration tests with Supertest
cover the real HTTP path against an isolated in-memory MongoDB, which
catches wiring mistakes mocks cannot see. The Selenium test drives the actual
React UI in Chrome — add book, add member, issue, return — and passed on my
machine. `[PERSONAL: describe one real bug Selenium or the integration tests
found that unit tests missed.]`

Continuous integration through GitHub Actions re-runs tests, coverage and the
frontend build on every push, which turns "it works on my machine" into a
shared, visible fact. As the self-directed tool I learned **Swagger/OpenAPI**:
one YAML file now generates interactive documentation at `/api-docs`, and I
can test any endpoint from the browser. I chose it over a README because a
spec is structured, versionable and harder to let drift out of date.
`[PERSONAL: mention which Swagger resources you actually used (swagger.io
docs, a video, etc.) and one difficulty you had, e.g. YAML formatting.]`

The hardest part was `[PERSONAL: replace with your real challenge — e.g.
understanding atomic MongoDB updates, React select state in Selenium, or
wiring dependency injection]`. I resolved it by `[PERSONAL: your real
solution steps]`. The learning resources I relied on were mostly official
documentation (Mongoose, Jest, Express, Tailwind), which I evaluated by
whether they matched the project's library versions and whether I could apply
them within one sitting.

The system has clear limitations: no authentication, no payment flow, regex
search instead of Atlas Search, and no multi-document transactions — the
issue workflow instead uses an atomic conditional stock update, which I
documented honestly rather than overclaiming. In the future I want to learn
proper authentication (JWT with role checks) and containerised deployment
(Docker), because the next realistic step for this application is running it
safely for real users rather than adding more features.

`[FINAL STEP: after your viva rehearsals and real test runs, re-read the essay
aloud, keep it between 500 and 700 words, and remove every bracketed marker.]`
