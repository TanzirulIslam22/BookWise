# Smart Library & Fine Management System

A full-stack **MERN + Tailwind CSS** library management application built for
the CSE 3206 Software Engineering Sessional (22 Series) course at RUET.
It demonstrates the complete SDLC: requirements, design patterns
(Singleton, Facade, Strategy), Test-Driven Development, mocking, integration
testing, Selenium E2E testing, CI with GitHub Actions, and Swagger/OpenAPI
documentation.

## Features (5 functional modules + operator login)

0. **Librarian login gate** — the web UI opens at a login page; the single
   librarian/admin account is verified server-side (`ADMIN_USERNAME` /
   `ADMIN_PASSWORD` in `.env`). Default demo credentials: `librarian` /
   `bookwise123`. (A simple single-operator gate — not full JWT/RBAC auth.)
1. **Member management** — register students/faculty/librarians with unique IDs, search and filter.
2. **Book catalog** — add books, search by title/author/ISBN, track total and available copies.
3. **Borrow & return** — issue books with a 14-day due date, enforce per-role borrowing limits, process returns; active records show overdue badges and recently-returned history is listed with fines.
4. **Fine management** — Student 10 BDT/overdue day; after the first 7 overdue days 20 BDT/day; Faculty 0 BDT. Live overdue list; fines charged only on return of an overdue book.
5. **Notification & audit** — every issue/return/fine/overdue event is stored as an audit record; the UI shows success/error toasts.

## Technology stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3.4, React Router 6, Axios |
| Backend | Node.js 22, Express 4, JavaScript, REST |
| Database | MongoDB (Atlas or local) via Mongoose 8 |
| Testing | Jest 29 (unit + mocks), Supertest 7 (integration), Selenium WebDriver 4 (E2E) |
| API docs | swagger-ui-express 5 + OpenAPI 3.0 (`server/docs/openapi.yaml`) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| Report | LaTeX (XeLaTeX/LuaLaTeX) in `docs/report/` |

## Architecture overview

```
React SPA (client)  --HTTP/JSON-->  Express REST API (server)  --Mongoose-->  MongoDB
                                        |
                                        +-- DatabaseManager (Singleton): one shared connection manager
                                        +-- BorrowFacade: issue/return workflows
                                        +-- FineService + FineStrategy: interchangeable fine policies
                                        +-- AuditService: persistent activity log
```

- Controllers stay thin; the **Facade** (`server/src/facades/BorrowFacade.js`) coordinates multi-step workflows.
- Fine policies are **Strategy** classes (`server/src/strategies/`).
- The database connection is owned by a **Singleton** (`server/src/database/DatabaseManager.js`).

## Prerequisites

- Node.js ≥ 18 (developed on Node 22)
- npm ≥ 9
- MongoDB: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster **or** a local `mongod` — *or simply use the in-memory demo mode below, which needs no MongoDB at all*
- Chrome or Edge for Selenium tests
- (Report only) XeLaTeX or LuaLaTeX with `fontspec` (e.g. TeX Live / MiKTeX)

## Installation (fresh clone)

```bash
git clone <your-repo-url>
cd smart-library

# backend
cd server
npm ci            # or: npm install
cp ../.env.example .env   # then edit .env if you use a real MongoDB
cd ..

# frontend
cd client
npm ci
cd ..

# e2e
cd e2e
npm ci
cd ..
```

## Environment variables

Copy `.env.example` to `server/.env`. Never commit `.env`.

| Variable | Meaning | Example |
|----------|---------|---------|
| `PORT` | API port | `5000` |
| `MONGODB_URI` | Real database | `mongodb://127.0.0.1:27017/smart_library` or Atlas SRV string |
| `LOAN_PERIOD_DAYS` | Loan length | `14` |
| `CLIENT_ORIGIN` | CORS origin for the React dev server | `http://localhost:5173` |
| `ADMIN_USERNAME` | Login-gate username | `librarian` |
| `ADMIN_PASSWORD` | Login-gate password (change it!) | `bookwise123` |
| `MONGODB_URI_TEST` | Optional; leave empty to let tests spin up an isolated in-memory MongoDB | (empty) |

## Running the application

**Option A — with a real MongoDB (Atlas/local):**

```bash
# terminal 1
cd server && npm start
# terminal 2
cd client && npm run dev
```

**Option B — demo mode without any MongoDB install** (temporary in-memory DB):

```bash
cd server && npm run start:memory
cd client && npm run dev
```

**Load the demo dataset** (9 members, 10 books, active/overdue/returned
borrows with real fines and audit events — wipes the target database first):

```bash
cd server && npm run seed                # seeds the database in server/.env
# or, for a throwaway in-memory demo already filled with demo data:
cd server && npm run start:memory:seed
```

- Frontend: http://localhost:5173 — log in with `librarian` / `bookwise123`
- Backend: http://localhost:5000
- Swagger UI: http://localhost:5000/api-docs
- OpenAPI JSON: http://localhost:5000/api/openapi.json

## Testing

```bash
cd server

npm run test:unit          # unit tests (strategies, facade with mocks, singleton)
npm run test:integration   # Supertest API tests on an isolated in-memory MongoDB
npm test                   # everything
npm run test:coverage      # coverage report -> server/coverage/
```

Coverage meanings: **statement/line** = % of code lines executed; **branch** =
% of if/else paths taken; **function** = % of functions called. Recorded run
on this project: **68 tests passed, 90.31% statements, 72.86% branches, 91.39%
functions, 91.36% lines** (run `npm run test:coverage` yourself to reproduce;
paste your own output into the report).

Integration tests use `mongodb-memory-server` (an isolated throwaway MongoDB),
so they can never modify development or Atlas data. If `MONGODB_URI_TEST` is
set, that URI is used instead.

### Selenium end-to-end

```bash
cd e2e
npm test            # headless Chrome
npm run test:headed # watch the browser
```

The orchestrator (`e2e/run-e2e.js`) starts the backend in in-memory demo
mode, builds and serves the frontend with `vite preview` on port 4173, runs
the browser test (open app → add book → add member → issue → verify toast →
return → verify "No fine"), then shuts everything down. Selenium Manager
(built into selenium-webdriver 4) downloads the matching ChromeDriver.

Recorded result on the development machine: **E2E TEST PASSED** (all 6 steps).
Re-run it yourself and screenshot the output for the report.

Troubleshooting: ports 5000/4173 already in use → stop the other process or
change `PORT`; corporate proxies may block Selenium Manager's driver download
→ pre-install ChromeDriver and set the `PATH`; still failing → run
`npm run test:headed` to watch the browser.

## REST API (summary)

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `/api/auth/login` | Log in the librarian/admin operator |
| POST | `/api/members` | Register member |
| GET | `/api/members?q=&role=` | List/search members |
| GET | `/api/members/:id` | Member details |
| POST | `/api/books` | Add book |
| GET | `/api/books?q=` | List/search books |
| GET | `/api/books/:id` | Book details |
| POST | `/api/borrowings/issue` | Issue book `{memberId, bookId}` |
| POST | `/api/borrowings/return/:id` | Return book |
| GET | `/api/borrowings?status=` | List records |
| GET | `/api/fines/overdue` | Overdue records with live fines |
| GET | `/api/fines/preview/:id` | Fine preview (no state change) |
| GET | `/api/audits?eventType=` | Audit history |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api-docs` | Swagger UI |

Full request/response schemas: `server/docs/openapi.yaml` (rendered at
`/api-docs`). Try any endpoint live from Swagger UI's "Try it out" button.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

1. **backend-tests** — `npm ci`, unit + integration tests with coverage
   (isolated in-memory MongoDB, no secrets required), uploads the coverage
   report as an artifact.
2. **frontend-build** — `npm ci` + `vite build` (fails on build errors).
3. **selenium-e2e** — builds and serves the app on the runner (Chrome is
   preinstalled on GitHub's ubuntu images) and runs the browser test.

Inspect runs under the repo's **Actions** tab; open a failed job → step →
raw log. Commit `package-lock.json` files so `npm ci` works. Note: the
workflow is included and locally verified; a green checkmark on GitHub only
exists after **you** push and the runners succeed — do not claim CI passed
without that evidence.

## Project structure

```text
smart-library/
├── client/            React + Vite + Tailwind frontend
├── server/            Express + Mongoose backend (+ tests, Swagger spec)
├── e2e/               Selenium WebDriver tests + orchestrator
├── docs/
│   ├── diagrams/      Mermaid sources (use case, class, sequences, SDLC, ER)
│   ├── evidence/      recorded test-run logs
│   ├── report/        LaTeX report + reflection essay
│   ├── requirements.md, tdd-workflow.md, git-workflow.md, learning-log.md,
│   │   demo-viva.md, traceability-matrix.md
├── .github/workflows/ci.yml
├── .env.example
└── README.md
```

## Five-minute demo

See `docs/demo-viva.md` for the step-by-step demo script, pre-demo command
checklist, and viva Q&A.

## Limitations

- Login is a **single-operator access gate** (one librarian/admin account
  verified by the server, session kept in `sessionStorage`) — not full
  authentication: no JWT, no password hashing store, no per-user sessions and
  no role-based authorization. Full auth was explicitly out of scope.
- In-memory demo mode loses data on restart; only `MONGODB_URI` persists.
  Use `npm run seed` (or `start:memory:seed`) to reload the demo dataset.
- Fines are calculated and displayed but not paid/refunded.
- Text search uses regex (simple, case-insensitive) rather than MongoDB Atlas Search.
- MongoDB multi-document transactions are not used; the issue workflow relies
  on an atomic conditional update (`availableCopies > 0`) plus ordered steps,
  which is safe for this small scale but is not a transactional guarantee.
- No pagination; lists are capped for a small academic library.

## AI-assistance disclosure

This project was developed with the assistance of an AI coding tool
(OpenCode / large language model). The AI generated starter code, tests,
documentation drafts and diagrams; the student is responsible for reviewing,
understanding, running and defending every part of the system. Adapt this
statement to describe your actual usage before submission, and be prepared to
explain any file during the viva.

## License

MIT — see source headers. Built for academic purposes.
/ /   F i n e   s t r a t e g y   p a t t e r n   l o g i c  
 e x p e r i m e n t a l _ f e a t u r e = t r u e  
 