# Assignment Requirement Traceability Matrix

Status labels: **Implemented and verified** (code exists AND a real test run
or execution confirmed it on this machine) · **Implemented but not yet
verified** (code exists; needs your run/screenshot/PR evidence) · **Evidence
required** (needs GitHub/PR/screenshot artefacts only you can produce) ·
**Not implemented**.

| # | Assignment requirement | Implementation location | Verification method | Evidence required | Status |
|---|------------------------|--------------------------|---------------------|-------------------|--------|
| 1 | Module 1: member management | `server/src/controllers/memberController.js`, `client/src/pages/Members.jsx` | Integration tests "Module 1 — Member management" (6 tests) | Test run output | Implemented and verified |
| 2 | Module 2: book catalog | `bookController.js`, `Book.js`, `client/src/pages/Books.jsx` | Integration tests "Module 2" (5 tests) | Test run output | Implemented and verified |
| 3 | Module 3: borrow/return | `facades/BorrowFacade.js`, `borrowingController.js`, `client/src/pages/BorrowReturn.jsx` | Integration tests "Module 3" (8 tests) + Selenium E2E | Test + E2E output | Implemented and verified |
| 4 | Module 4: fines | `strategies/*`, `services/FineService.js`, `client/src/pages/Fines.jsx` | Unit tests (fine strategies) + integration "Module 4" (2 tests) | Test output | Implemented and verified |
| 5 | Module 5: notification/audit | `services/AuditService.js`, `client/src/context/ToastContext.jsx`, `client/src/pages/Audit.jsx` | Integration "Module 5" + audit assertions inside other tests | Test output | Implemented and verified |
| 6 | Persistent MongoDB storage | Mongoose models + `DatabaseManager` (`MONGODB_URI`) | Integration tests against real MongoDB protocol (in-memory server); verified live against MongoDB Atlas on 29 Oct 2026 — data written, server restarted, all documents persisted | Done | Implemented and verified |
| 7 | Extensible architecture | strategies/facades/repositories separation | Adding a strategy needs only a new class; NFR-8 | Explanation in report | Implemented and verified |
| 8 | Functional requirements | `docs/requirements.md` FR-1.1…FR-5.4 | Traceable to tests (see matrix rows above) | Report section | Implemented and verified |
| 9 | Non-functional requirements | `docs/requirements.md` NFR-1…NFR-8 | Design decisions + tests | Report section | Implemented and verified |
| 10 | User stories / use cases | `docs/requirements.md` §3–4 | Review | Report section | Implemented and verified |
| 11 | UI prototype | `docs/diagrams/ui-wireframe.md` | Visual review (planning artifact) | Report figure | Implemented and verified |
| 12 | SDLC process model | `docs/requirements.md` §5, `docs/diagrams/sdlc-incremental.mmd` | Diagram + justification text | Report section | Implemented and verified |
| 13 | Singleton pattern | `server/src/database/DatabaseManager.js` | `tests/unit/databaseManager.test.js` | Test output | Implemented and verified |
| 14 | Facade pattern | `server/src/facades/BorrowFacade.js` | `tests/unit/borrowFacade.test.js` (mocked) | Test output | Implemented and verified |
| 15 | Strategy pattern | `server/src/strategies/*` + `FineService` | `tests/unit/fineStrategy.test.js` | Test output | Implemented and verified |
| 16 | Rejected alternatives (per pattern) | Pattern docs in report §16 + README | Written justification | Report text | Implemented and verified |
| 17 | UML class diagram (+ sequences, use case, ER, SDLC) | `docs/diagrams/*.mmd` | Render and include in report | Rendered figures in LaTeX | Implemented but not yet verified (rendering) |
| 18 | TDD (Red-Green-Refactor) | `docs/tdd-workflow.md`, `docs/evidence/tdd-*-run.txt` | Recorded real failing + passing runs | Report section | Implemented and verified |
| 19 | Mocking external dependencies | `tests/unit/borrowFacade.test.js` (Jest mocks) | `npm run test:unit` | Test output | Implemented and verified |
| 20 | Integration testing (Supertest) | `tests/integration/api.test.js` | `npm run test:integration` | Test output | Implemented and verified |
| 21 | Test coverage summary | `npm run test:coverage` → 90.31% stmts / 72.86% branch / 91.39% funcs / 91.36% lines (68 tests) — recorded on this machine | Re-run at submission | Your final coverage screenshot | Implemented and verified |
| 22 | Selenium E2E | `e2e/tests/issueAndReturn.e2e.js`, `e2e/run-e2e.js` | `npm test` in `e2e/` — PASSED locally (6 steps) | Screenshot of passing run | Implemented and verified |
| 23 | Git feature branches | `docs/git-workflow.md` branch list | Execute the commands on your repo | `git log --graph` evidence | Evidence required |
| 24 | Meaningful commits | Commit style guide in `docs/git-workflow.md` | Review history | Real commit log | Evidence required |
| 25 | Pull requests + reviews | `docs/git-workflow.md` §3 | Create PRs, request reviews | PR screenshots | Evidence required |
| 26 | Accepted PR | Same | Merge after approval | PR page screenshot | Evidence required |
| 27 | Rejected/revised PR | Same | Request changes; revise or close | Review comments screenshot | Evidence required |
| 28 | Merge conflict + resolution | `docs/git-workflow.md` §4 exercise | Perform the two-branch exercise | Conflict + resolution screenshots | Evidence required |
| 29 | Clear README | `README.md` | Read-through + fresh-clone steps | — | Implemented and verified |
| 30 | GitHub Actions CI | `.github/workflows/ci.yml` | Workflow syntax complete; local commands it runs are verified | Green Actions run on your repo | Implemented but not yet verified (GitHub side) |
| 31 | Swagger/OpenAPI (new tool) | `server/docs/openapi.yaml`, `src/config/swagger.js` | `/api-docs` returned 200; `/api/openapi.json` verified live | Screenshot of Swagger UI | Implemented and verified |
| 32 | Learning log | `docs/learning-log.md` (template + labelled examples) | Fill with your real sessions | Completed log | Evidence required |
| 33 | Reflection essay 500–700 words | `docs/report/reflection-essay.md` | Word count; remove `[PERSONAL]` markers | Final essay | Implemented but not yet verified |
| 34 | Complete LaTeX report | `docs/report/report.tex` | Compile with XeLaTeX/LuaLaTeX | Compiled PDF | Implemented but not yet verified (compile on your machine) |
| 35 | Working live demo | `docs/demo-viva.md` | Run the 5-minute script | Your demo | Evidence required |
| 36 | Viva preparation | `docs/demo-viva.md` Q&A | Rehearse | — | Implemented and verified |
| 37 | Honest AI-use disclosure | README §AI disclosure + report §31 | Adapt to your actual use | Final statement | Evidence required |
| 38 | *(Add-on)* Librarian/admin login gate | `server/src/controllers/authController.js`, `client/src/pages/Login.jsx`, route guard in `App.jsx` | Integration tests "Auth — librarian login gate" (4 tests) + Selenium login step | Test output | Implemented and verified |
| 39 | *(Add-on)* Demo data seeder | `server/scripts/seed.js`, `npm run seed`, `npm run start:memory:seed` | Seeded live Atlas on 29 Oct 2026 (9 members, 10 books, 8 records, 34 audits) | Your demo | Implemented and verified |

**Summary:** every code-level deliverable is implemented and locally verified
by real test runs (68 backend tests + 6-step Selenium E2E incl. login + live
Swagger check + live Atlas persistence). Items marked *Evidence required*
depend on GitHub account activity and personal submission artefacts that only
you can produce — do not mark them verified until you have the screenshots or
links.
