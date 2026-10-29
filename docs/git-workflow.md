# Git & GitHub Configuration-Management Guide

Perform these steps yourself on your GitHub account — they produce the real
evidence the assignment requires. Nothing here is pre-faked.

## 1. Initialise the repository

```bash
git init
git checkout -b main
git add .
git commit -m "chore: initial project structure (server, client, e2e, docs)"
```

**What makes a commit message useful:** a short imperative summary
("add", "fix", "test") under ~70 characters, describing *what changed and
why* at a glance. Good: `feat: add heavy-overdue fine strategy with boundary tests`.
Bad: `update`, `fix stuff`, `final final2`.

## 2. Feature branches (naming convention)

```bash
git checkout -b feature/member-management     # modules: members
git checkout -b feature/book-catalog          # modules: books
git checkout -b feature/borrow-return         # facade + borrow/return
git checkout -b feature/fine-strategy         # strategy pattern + fines
git checkout -b test/unit-and-integration     # jest + supertest suites
git checkout -b test/selenium-e2e             # selenium suite
git checkout -b docs/swagger-openapi          # swagger config + spec
git checkout -b ci/github-actions             # .github/workflows/ci.yml
```

Work on a branch, commit with meaningful messages, push, open a PR:

```bash
git add server/src/strategies
git commit -m "feat: add Student/Faculty/Heavy fine strategies with unit tests"
git push -u origin feature/fine-strategy
gh pr create --title "Add fine calculation strategies" \
  --body "Implements FR-4.2..4.5. Tests: 12 unit tests. Coverage for strategies: ~94%."
```

## 3. Pull requests and reviews

- Open at least **one accepted PR**: request a review (classmate/TA),
  address comments with new commits (`git commit -m "fix: ..."`), then merge.
- Open at least **one rejected or revised PR**: a PR that gets review comments
  requiring changes before acceptance (or is closed unmerged). Attach the
  review comments as report evidence (screenshot or `gh pr view` output).

PR review checklist (use this when reviewing a classmate):

- [ ] Code correctness — logic matches the requirement / user story
- [ ] Naming and readability — a beginner can follow it
- [ ] Tests — new behaviour has tests; existing tests still pass
- [ ] Error handling — failures return sensible status codes/messages
- [ ] No secrets — no `.env`, credentials, or personal data committed
- [ ] Documentation — README/API docs updated if behaviour changed
- [ ] Scope — no unrelated files or formatting-only noise in the diff

## 4. Reproducing a merge conflict (safe exercise)

```bash
git checkout main
git checkout -b practice/conflict-a
# edit the same line of README.md (e.g. the project title line)
git commit -am "docs: rename title on branch A"

git checkout main
git checkout -b practice/conflict-b
# edit the SAME line of README.md differently
git commit -am "docs: rename title on branch B"

git checkout main
git merge practice/conflict-a
git merge practice/conflict-b
# -> CONFLICT (content): Merge conflict in README.md
```

Resolve it:

```bash
# open README.md, choose the final wording, delete the <<<<<<< ==== >>>>>>> markers
git add README.md
git commit -m "docs: resolve README title merge conflict between branch A and B"
git log --oneline --graph -5   # inspect the resolved history
```

Optional cleanup: `git branch -d practice/conflict-a practice/conflict-b`

## 5. Evidence to collect for the report

- `git log --oneline --graph --all` output (screenshot or text)
- PR list: `gh pr list --state all`
- Accepted PR page + review comments
- Rejected/revised PR page + review comments
- Conflict resolution: screenshot of conflicted file + final resolved commit
- Contribution graph / `git shortlog -sn` showing your own commits

Do **not** invent repository URLs, PR numbers, or review text — run the
commands and paste the real output into the report appendices.
