# Requirements Engineering — Smart Library & Fine Management System

## 1. Functional Requirements

### Module 1 — User and Member Management
- **FR-1.1** The system shall allow a librarian to register a new member with a unique `memberId`, name, optional email and a role of Student, Faculty or Librarian.
- **FR-1.2** The system shall reject registration when `memberId` is already taken (HTTP 409).
- **FR-1.3** The system shall validate that `memberId`, `name` and `role` are present and that `role` is one of the three allowed values.
- **FR-1.4** The system shall list all members and support searching by name, member ID or email, and filtering by role.

### Module 2 — Book Catalog Management
- **FR-2.1** The system shall allow a book to be added with a unique ISBN, title, author and total number of copies; `availableCopies` is initialised equal to `totalCopies`.
- **FR-2.2** The system shall reject a duplicate ISBN (HTTP 409) and invalid copy counts (HTTP 400).
- **FR-2.3** The system shall list the catalog and support searching by title, author or ISBN (case-insensitive).
- **FR-2.4** The system shall never allow `availableCopies` to become negative or to exceed `totalCopies`.

### Module 3 — Borrow and Return Management
- **FR-3.1** The system shall issue an available book to an existing member, recording `borrowedAt` and a `dueDate` 14 days later.
- **FR-3.2** The system shall enforce borrowing limits: Student 3 active books, Faculty 5, Librarian 0 (not allowed to borrow).
- **FR-3.3** The system shall reject issuing when no copies are available (HTTP 409) or the member does not exist (HTTP 404).
- **FR-3.4** The system shall process a return, set `returnedAt` and `status = returned`, and restore `availableCopies` (capped at `totalCopies`).
- **FR-3.5** The system shall list active and returned borrowing records separately.

### Module 4 — Fine Management
- **FR-4.1** The system shall compute overdue days as whole days between `dueDate` and the return time (or current time for live previews), never negative.
- **FR-4.2** Fine policy — Student: 10 BDT per overdue day; the first 7 overdue days use this rate.
- **FR-4.3** Fine policy — Heavy overdue: days beyond the first 7 are charged 20 BDT each (day 8 = 70 + 20 = 90 BDT).
- **FR-4.4** Fine policy — Faculty (and Librarian): 0 BDT regardless of overdue days.
- **FR-4.5** A book returned on or before its due date shall have a fine of exactly 0 BDT; a fine shall never be negative.
- **FR-4.6** The system shall list all currently overdue records with live fine amounts in BDT.

### Module 5 — Notification and Audit Management
- **FR-5.1** The system shall record audit events for: member creation, book addition, book issuance, book return, fine calculation and overdue detection.
- **FR-5.2** Each audit event shall store event type, optional member/borrow-record references, a human-readable message and a timestamp.
- **FR-5.3** The system shall return a success or failure message with every mutating API call, which the web interface displays as an in-app notification.
- **FR-5.4** The system shall display a filterable activity history page.

## 2. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Usability | The interface shall be usable without training for a librarian: one screen per module, clear forms, and visible success/error messages. |
| NFR-2 | Maintainability | Business rules (fines, limits) shall live in small single-responsibility modules; the codebase shall stay readable by a beginner. |
| NFR-3 | Data integrity | Duplicate `memberId`/ISBN must be impossible; `availableCopies` shall be updated with atomic conditional updates; fine amounts shall never be negative. |
| NFR-4 | Reliability | API errors shall return consistent JSON through one centralised error handler; a failed operation must not leave partial state (stock updated but no record, etc.). |
| NFR-5 | Security | No credentials in code or API responses; input validation on all write endpoints; environment-based configuration only. (No authentication — explicitly out of scope.) |
| NFR-6 | Performance | The API shall respond in well under one second for a library of a few thousand books and members; list endpoints return at most a few hundred rows. |
| NFR-7 | Testability | Business logic shall be unit-testable without a database (dependency injection + mocks) and endpoints testable against an isolated test database. |
| NFR-8 | Extensibility | Adding a new fine policy shall require only a new strategy class; adding a new role-specific rule shall not modify the controller layer. |

## 3. User Stories

1. **As a librarian, I want to register members with a unique ID,** so that borrowing rights can be tracked per person.
2. **As a librarian, I want to add books with copy counts,** so that the catalog reflects the physical shelf.
3. **As a librarian, I want to search books by title, author or ISBN,** so that I can find a record in seconds.
4. **As a librarian, I want to issue an available book to a member with a due date,** so that borrowing is recorded and availability drops.
5. **As a librarian, I want to process a return that automatically calculates any fine,** so that I do not have to count overdue days by hand.
6. **As a librarian, I want to see all overdue books with live fines,** so that I can follow up with members.
7. **As a librarian, I want an activity history,** so that every issue, return and fine is traceable.
8. **As a member, I want to see my active borrows and due dates,** so that I can return books on time.
9. **As a student, I want fines calculated by a documented policy,** so that the amount charged is predictable.

## 4. Use Cases (selected)

### UC-1: Issue a Book
- **Actor:** Librarian
- **Preconditions:** Member and book exist; book has ≥ 1 available copy; member below borrowing limit.
- **Main flow:** 1) Librarian selects member and book → 2) System validates member, limit and availability → 3) System creates a borrow record with due date (+14 days) → 4) System decrements `availableCopies` → 5) System records a `BOOK_ISSUED` audit event → 6) System confirms with a success message.
- **Alternative flows:** 2a) No copies → error "No copies available"; 2b) Limit reached → error with limit; 2c) Member missing → 404.

### UC-2: Return a Book and Calculate Fine
- **Actor:** Librarian
- **Preconditions:** The borrowing record exists and is `active`.
- **Main flow:** 1) Librarian clicks Return → 2) System computes overdue days → 3) System selects the fine strategy by member role → 4) System sets fine, `returnedAt`, `status = returned` → 5) System restores `availableCopies` → 6) System logs `BOOK_RETURNED` (+ `OVERDUE_DETECTED` and `FINE_CALCULATED` when overdue) → 7) System shows the fine in the message.
- **Alternative flows:** Already returned → 409; returned on time → fine is 0.

### UC-3: View Overdue Fines
- **Actor:** Librarian
- **Main flow:** Opens Fines page → system lists active overdue records with overdue days and live fine per role policy.

## 5. SDLC Process Model — Incremental Model

| Increment | Contents | Independently testable? |
|-----------|----------|-------------------------|
| I1 | Requirements, design, schemas, API contract, prototype | Yes — review + schema validation |
| I2 | Member + book management (modules 1–2) | Yes — CRUD + validation tests |
| I3 | Borrow/return (module 3) | Yes — issue/return workflow tests |
| I4 | Fines + audit (modules 4–5) | Yes — strategy unit tests + audit tests |
| I5 | Testing hardening, Swagger, CI, Selenium, documentation | Yes — suites + CI run |

**Justification:** the five modules are largely independent and each produces a working, demonstrable slice of value. Incremental development lets each module be implemented, tested and demonstrated before the next one starts, which matches a small team (one student) and reduces risk: a fine-policy change cannot break member registration because they live in separate increments and separate files.

See `docs/diagrams/sdlc-incremental.mmd` for the diagram.

## 6. Prototype

A low-fidelity wireframe of the planned screens is in `docs/diagrams/ui-wireframe.md`. It was drawn **before** implementation and shows the planned dashboard, member page, catalog, issue/return workflow, fines and audit history. The prototype is a planning artefact, not evidence that the application works.
