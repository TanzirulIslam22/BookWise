# Learning Log — Template and Guidance

Copy this table into your own notes (or a spreadsheet) and fill one row per
study session. The rows marked **[EXAMPLE]** are illustrative samples written
to show the expected level of detail — they are **not** a record of your real
activity and must be replaced/removed before submission.

## Template

| Date | Task | Learning resource | What I learned | Challenge encountered | Solution or experiment | Evidence | Time spent |
|------|------|-------------------|----------------|----------------------|------------------------|----------|------------|
| YYYY-MM-DD | short task description | URL/book/video + why chosen | concrete concept in your own words | what went wrong | what you tried and the outcome | commit link, test output, screenshot | ~Xh |

## [EXAMPLE] rows (illustrative only)

| Date | Task | Learning resource | What I learned | Challenge encountered | Solution or experiment | Evidence | Time spent |
|------|------|-------------------|----------------|----------------------|------------------------|----------|------------|
| 2026-11-01 | [EXAMPLE] Implement fine strategies | Official Jest docs (jestjs.io/docs/using-matchers) + MDN | How `expect().toBe` differs from `toEqual`; table-driven tests | Confusion between `toBe` and `toEqual` for objects | Wrote both forms for one object and compared failure messages | branch `feature/fine-strategy`, commit `test: add strategy boundary cases` | ~1.5h |
| 2026-11-05 | [EXAMPLE] Configure Swagger UI | swagger-ui-express README + OpenAPI 3.0 spec guide | How an OpenAPI YAML maps to express routes; `/api-docs` is generated from the spec file | YAML indentation errors silently broke the UI | Validated the spec by fetching `/api/openapi.json` and checking paths | commit `docs: add OpenAPI spec for all endpoints` | ~2h |

## Recommended resources (official or beginner-friendly)

| Tool | Resource | Why |
|------|----------|-----|
| React | react.dev/learn | Official interactive tutorial; current (React 18/19) |
| Tailwind CSS | tailwindcss.com/docs | Official docs; use the v3.x docs matching this project's `tailwindcss@3.4` |
| Node.js | nodejs.org/docs (API guides) | Official; focus on `events`, `Buffer`, modules |
| Express | expressjs.com/en/guide (4.x) | Official guide matching express@4 used here |
| MongoDB | mongodb.com/docs/manual + mongodbatlas University free courses | Official manual; Atlas free tier for the real database |
| Mongoose | mongoosejs.com/docs | Official; schemas, validation, populate |
| Jest | jestjs.io/docs/getting-started | Official; mocking (`jest.fn`), coverage docs |
| Supertest | github.com/ladjs/supertest README | Official README; pairs with Jest naturally |
| Selenium | selenium.dev/documentation/webdriver + selenium.dev/selenium/docs (bindings) | Official; note Selenium 4 includes Selenium Manager for driver setup |
| Git/GitHub | git-scm.com/book (Pro Git, free) + docs.github.com | Pro Git ch. 3 (branching) is essential |
| GitHub Actions | docs.github.com/en/actions | Official; workflow syntax + examples |
| Swagger/OpenAPI | swagger.io/specification + swagger.io/tools/swagger-ui | Official spec reference |
| LaTeX | latex-project.org/help + Overleaf learn sections | Overleaf has free tutorials that compile in the browser |

## How to evaluate a learning resource

1. **Correctness** — does it match the version this project uses (Express 4,
   Mongoose 8, Tailwind 3, Jest 29, Selenium 4)? Check dates and version badges.
2. **Clarity** — can you re-explain the concept in your own words after one
   read? If not, try a different source.
3. **Practical usefulness** — does it help you produce working code for *this*
   project within ~30 minutes, or is it purely theoretical?
4. **Relevance** — prefer official docs for APIs; prefer tutorials/blogs for
   *understanding*; cross-check any blog against the official docs before
   trusting behaviour claims.
5. **Authority** — prefer sources maintained by the library authors or a
   widely used publisher; watch out for unmaintained posts about old majors.
