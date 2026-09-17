# SAOBEO LEAD — Development Workflow & Codex Execution Plan
**Version:** 1.1  
**Date:** 2026-09-17  
**Purpose:** Stabilize the current codebase, make local development reproducible, move source control to GitHub, and create a low-token handoff process for ChatGPT/Codex.

---

# 1. Current Repository Audit

The uploaded repository is **Phase 0–1 only**, not the full SAOBEO LEAD product.

## Implemented

- Next.js App Router
- TypeScript
- Tailwind
- Prisma + PostgreSQL schema
- Admin login/session
- Single workspace
- Leads
- Lead detail
- CRM pipeline
- Activities
- Tasks/follow-up
- Basic dashboard
- Initial migration
- Seed script
- Basic unit test for Vietnamese business-name normalization

## Not implemented yet

- Google Places discovery
- Lead Inbox
- Google business enrichment
- Website detection
- Website audit
- PageSpeed Insights
- Screenshot worker
- Fit Score
- Opportunity Score
- Engagement Score
- Priority Score
- AI opportunity analysis
- AI outreach drafts
- Public audit reports
- Proposal generator
- Demo generator
- Automated sending

This is acceptable. Do **not** jump ahead and implement everything at once.

---

# 2. Important Findings From the Uploaded ZIP

## 2.1 `node_modules` and `.next` were included in the ZIP

These folders should not be transferred, committed, or reviewed.

They are machine-generated:

```text
node_modules/
.next/
```

The current `.gitignore` already ignores them correctly.

### Rule

GitHub must contain:

```text
package.json
package-lock.json
source code
Prisma schema/migrations
docs
```

but NOT:

```text
node_modules
.next
.env
```

Each computer must rebuild dependencies using:

```bash
npm ci
```

---

## 2.2 Current dependency versions

Current project includes approximately:

```text
Next.js 16.3.x
React 19.2.x
Prisma 6.19.x
TypeScript 5.x
```

Do not upgrade these packages during the stabilization task unless a concrete blocking bug requires it.

Next.js 16 requires Node.js 20.9+.

For this project, standardize development on:

```text
Node.js 22 LTS
```

This is compatible with the current stack and avoids different Node versions across machines.

---

## 2.3 Database migration exists

The repository contains:

```text
prisma/migrations/20260917000000_init/migration.sql
```

Good.

Production-style setup should use:

```bash
npx prisma migrate deploy
```

Development schema changes later should use:

```bash
npx prisma migrate dev --name <migration-name>
```

---

## 2.4 Current authentication is sufficient for local/internal MVP

Current implementation:

- password hashed with bcrypt;
- random session token;
- server-side SHA-256 token hash;
- httpOnly cookie;
- secure cookie in production;
- SameSite=Lax;
- session stored in DB.

Do not replace authentication framework now.

Before public Internet production, add:

- login rate limiting;
- expired-session cleanup;
- stronger operational logging;
- HTTPS;
- secure production secrets.

---

# 3. Recommended Development Environment

Goal: minimal software, reproducible development, no unnecessary infrastructure.

## Required

### 1. Git

Purpose:

- source control;
- commits;
- GitHub push/pull;
- rollback.

Install current stable Git for Windows.

Verify:

```bash
git --version
```

---

### 2. Node.js 22 LTS

Next.js 16 requires Node.js >= 20.9.

Use Node.js 22 LTS for this project.

Verify:

```bash
node -v
npm -v
```

Expected Node major:

```text
v22.x
```

Do not install multiple unrelated Node versions unless needed.

Optional later:

```text
nvm-windows
```

but it is not required for the first setup.

---

### 3. Docker Desktop

Recommended for PostgreSQL.

Why:

- avoids installing/configuring PostgreSQL manually;
- same DB environment across computers;
- reset/rebuild easily;
- easier for Codex to understand;
- less Windows-specific configuration.

On Windows use the WSL 2 backend.

Verify:

```bash
docker --version
docker compose version
```

---

### 4. Code editor

Recommended:

```text
VS Code
```

Useful extensions only:

```text
Prisma
ESLint
```

Do not install dozens of extensions.

---

## Optional

### GitHub Desktop

Use only if Git CLI feels inconvenient.

It is not technically required.

### Prisma Studio

No separate installation needed.

Run:

```bash
npx prisma studio
```

This is sufficient for visually inspecting the database during development.

### pgAdmin

Not needed initially if using Docker + Prisma Studio.

---

# 4. Do NOT Install Yet

Do not add these until their phase begins:

```text
Redis
BullMQ
Playwright system dependencies
Wappalyzer API
BuiltWith
Supabase
Vercel CLI
Google Cloud SDK
large observability stacks
Kubernetes
Dockerized Next.js app
```

For Phase 0–2, only PostgreSQL needs Docker.

Keep the Next.js app running normally with:

```bash
npm run dev
```

---

# 5. Recommended Local Architecture

Use:

```text
Windows
│
├─ Git
├─ Node.js 22
├─ VS Code / Codex
│
└─ Docker Desktop
    └─ PostgreSQL
```

Application:

```text
Next.js running locally
http://localhost:3000
```

Database:

```text
PostgreSQL Docker container
localhost:5432
```

Do NOT Dockerize the whole application during the MVP.

That adds complexity without solving a current problem.

---

# 6. Add Docker Compose for PostgreSQL

Create:

```text
docker-compose.yml
```

Recommended minimal structure:

```yaml
services:
  db:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_DB: saobeo_lead
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - saobeo_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d saobeo_lead"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  saobeo_pgdata:
```

Local `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saobeo_lead?schema=public"
ADMIN_EMAIL="YOUR_EMAIL"
ADMIN_PASSWORD="USE_A_UNIQUE_PASSWORD_AT_LEAST_12_CHARS"
ADMIN_NAME="Sao Béo"
```

`.env` must never be committed.

---

# 7. One-command-ish Local Setup

After cloning the repo:

```bash
docker compose up -d db
npm ci
copy .env.example .env
```

Edit `.env`.

Then:

```bash
npx prisma migrate deploy
npm run seed
npm run dev
```

Open:

```text
http://localhost:3000
```

Validation:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

A task is not considered complete if required checks fail.

---

# 8. GitHub Strategy

## Decision

Use a **private GitHub repository**.

Local disk is the working copy.

GitHub is the canonical source of truth.

Do not use ZIP files as the main project history.

---

## Recommended repository name

```text
saobeo-lead
```

Visibility:

```text
Private
```

---

## First Git setup

From project root:

```bash
git init
git add .
git commit -m "chore: baseline SAOBEO LEAD phase 0-1"
git branch -M main
```

Create a blank private repository on GitHub.

Then:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

Never push:

```text
.env
API keys
passwords
database exports containing real contacts
```

---

# 9. Branch Workflow

Keep it simple.

Use:

```text
main
```

for stable code.

Each Codex task:

```text
codex/<short-task-name>
```

Examples:

```text
codex/dev-environment
codex/discovery-google-places
codex/lead-inbox
codex/website-audit
```

Then merge after checks pass.

Do not create elaborate GitFlow branches.

---

# 10. ChatGPT / GitHub Workflow

Connect the private GitHub repository to ChatGPT.

Once repository access is authorized, future requests should reference:

```text
repository name
branch
commit / PR if relevant
```

Example:

```text
Review saobeo-lead on main.
Read PROJECT_STATE.md first.
Then inspect only the files changed since the previous completed phase.
```

Important:

GitHub access is retrieved on demand; do not assume a permanently synchronized code index.

Therefore the repository must maintain a compact handoff file.

---

# 11. The Most Important Process Improvement: PROJECT_STATE.md

Create a single root file:

```text
PROJECT_STATE.md
```

This replaces repeated ZIP uploads and long explanations.

It must stay short.

Maximum recommended length:

```text
150–250 lines
```

Do not turn it into documentation history.

Git already stores history.

---

# 12. PROJECT_STATE.md Template

```md
# SAOBEO LEAD — Project State

Last updated:
Commit:
Branch:

## Current Phase
Phase 1 — CRM Core

## Runtime
- Node: 22.x
- Next.js: 16.3.x
- Prisma: 6.19.x
- DB: PostgreSQL 17 via Docker

## Working
- Login
- Dashboard
- Lead CRUD
- Pipeline
- Activities
- Tasks
- PostgreSQL migration
- Seed

## Not Implemented
- Discovery
- Lead Inbox
- Audit
- Scoring
- AI

## Known Issues
- None / list only reproducible issues

## Verification
- npm run typecheck: PASS/FAIL
- npm run lint: PASS/FAIL
- npm test: PASS/FAIL
- npm run build: PASS/FAIL

## Last Completed Task
<one short paragraph>

## Current Task
<one short paragraph>

## Next Task
<one short paragraph>

## Important Decisions
- GitHub private repo is source of truth.
- PostgreSQL runs through Docker in development.
- No auto outreach in MVP.
- No framework upgrades without a blocking reason.
```

---

# 13. Codex Must Maintain PROJECT_STATE.md

At the end of every successful task Codex must:

1. update `PROJECT_STATE.md`;
2. record the current phase;
3. list only real working features;
4. list known reproducible issues;
5. record verification results;
6. record the next logical task.

Do not write a long diary.

Do not repeat the full specification.

---

# 14. Commit Discipline

Each Codex task should end with a coherent diff.

Recommended commit format:

```text
feat: add Google Places discovery
fix: protect lead workspace mutations
test: add scoring rule tests
chore: add local postgres compose
docs: update project state
```

Avoid commits like:

```text
update
changes
fix stuff
codex work
```

---

# 15. What ChatGPT Should Read Next Time

Order:

```text
1. PROJECT_STATE.md
2. git diff / changed files
3. relevant schema/API files
4. tests
5. SAOBEO-LEAD-SPEC.md only when product context is needed
```

Do NOT re-read the entire repository by default.

This reduces token usage and improves accuracy.

---

# 16. What Codex Should Read Before Every Task

Required:

```text
PROJECT_STATE.md
AGENTS.md
relevant section of SAOBEO-LEAD-SPEC.md
only files related to the requested task
```

Not required:

```text
every source file
full spec for small bugfixes
node_modules
.next
old generated reports
```

---

# 17. Prompt Design Rule for Codex

Every implementation prompt must contain only:

```text
GOAL
CURRENT STATE
SCOPE
DO NOT DO
FILES/AREAS TO INSPECT
ACCEPTANCE CRITERIA
VERIFY
UPDATE PROJECT STATE
```

Do not give Codex five pages of motivational explanation.

---

# 18. Immediate Task — Stabilize Development Workflow

This task must happen before Phase 2.

## Goal

Make the existing Phase 0–1 project reliably cloneable and runnable on a clean Windows development machine.

## Scope

- add `docker-compose.yml` for PostgreSQL only;
- create/update `.env.example`;
- create `PROJECT_STATE.md`;
- ensure README local setup is correct;
- ensure `.gitignore` excludes generated/secrets;
- verify Prisma migration/seed workflow;
- add a DB health/setup note if necessary;
- run verification;
- fix only bugs that block verification.

## Do NOT

- implement Google Places;
- implement AI;
- redesign the UI;
- upgrade Next.js/Prisma;
- add Redis;
- add Supabase;
- add Vercel;
- Dockerize the Next.js application;
- refactor working code for style only.

---

# 19. COPY/PASTE PROMPT FOR CODEX — TASK A

```text
You are working on the existing SAOBEO LEAD repository.

Read, in this order:
1. AGENTS.md
2. PROJECT_STATE.md if it exists
3. README.md
4. package.json
5. prisma/schema.prisma
6. prisma/migrations/
7. the "Immediate Task — Stabilize Development Workflow" section in SAOBEO-LEAD-DEV-WORKFLOW.md

GOAL
Make Phase 0–1 reproducibly runnable on a clean Windows machine with Node.js 22 + Docker Desktop.

SCOPE
- Add docker-compose.yml with PostgreSQL only.
- Keep Next.js running natively with npm run dev.
- Ensure .env.example matches actual required variables.
- Create PROJECT_STATE.md using the provided compact template.
- Update README with exact clean setup:
  docker compose up -d db
  npm ci
  copy .env.example .env
  npx prisma migrate deploy
  npm run seed
  npm run dev
- Verify .gitignore excludes node_modules, .next, .env, build outputs.
- Confirm Prisma migration exists and works.
- Fix only reproducible blockers discovered during verification.

DO NOT
- Do not implement Phase 2.
- Do not add Google Places.
- Do not add AI.
- Do not add Redis/BullMQ.
- Do not add Supabase.
- Do not deploy anything.
- Do not redesign UI.
- Do not upgrade framework/dependencies unless the current versions cannot pass verification.
- Do not create new architectural abstractions without a current need.
- Do not rewrite working files just for formatting.

VERIFY
Run:
npm ci
docker compose up -d db
npx prisma migrate deploy
npm run seed
npm run typecheck
npm run lint
npm test
npm run build

If a verification step cannot run, state the exact command, exact error, and whether it is environment-related or code-related.

OUTPUT
Keep the final report short:
1. files changed;
2. checks PASS/FAIL;
3. blockers;
4. exact commands I should run locally.

MANDATORY HANDOFF
Update PROJECT_STATE.md at the end with:
- current phase;
- what actually works;
- what remains unimplemented;
- known issues;
- verification results;
- next task.

Do not write a long retrospective.
Do not implement anything outside this scope.
```

---

# 20. After Task A — GitHub Baseline

When Task A passes:

```bash
git status
git add .
git commit -m "chore: stabilize local development workflow"
git push
```

Then GitHub becomes the primary project copy.

---

# 21. Phase 2 Should Be Split

Do not ask Codex:

```text
"Implement Phase 2"
```

in one giant request.

Split it.

## Phase 2A

```text
Google Places provider + search session
```

## Phase 2B

```text
Lead Inbox + qualification
```

## Phase 2C

```text
Deduplication + create CRM lead
```

## Phase 2D

```text
Saved searches + usage/cost logging
```

This keeps code reviews small and avoids token waste.

---

# 22. Phase 2A Minimal Product Goal

First real business-value milestone:

```text
User chooses:
Đà Lạt
+
Homestay
↓
Google Places results appear
↓
User can select a business
↓
Create CRM lead
```

Nothing else is necessary before proving this workflow.

Do not build scoring, audit, or AI before this works.

---

# 23. COPY/PASTE PROMPT FOR CODEX — TASK B (ONLY AFTER TASK A PASSES)

```text
Read:
1. PROJECT_STATE.md
2. AGENTS.md
3. relevant discovery sections of SAOBEO-LEAD-SPEC.md
4. existing Prisma schema and lead code

Implement ONLY Phase 2A:
Google Places discovery + search session.

BUSINESS GOAL
From SAOBEO LEAD I need to search a target location and industry and see real business results that can later become CRM leads.

SCOPE
- Add a DiscoveryProvider interface only if needed by this implementation.
- Implement Google Places Text Search server-side.
- API key must never reach client code.
- Request the minimum fields needed for discovery.
- Add SearchSession persistence and API usage metadata.
- Add a simple /leads/discover screen.
- Inputs:
  location
  industry/keyword
  max results with a safe cap
- Render normalized results.
- Keep Google-derived discovery payload separate from CRM Lead records.
- Preserve provider external/place id.
- Handle provider errors visibly.

DO NOT
- No AI.
- No website audit.
- No PageSpeed.
- No screenshots.
- No scoring.
- No automated outreach.
- No Redis.
- No bulk enrichment.
- No fancy map.
- No redesign of current CRM.
- No speculative provider abstractions beyond what Google Places currently requires.

ACCEPTANCE
1. Search "homestay" + "Đà Lạt" returns provider results when a valid API key is configured.
2. API key is server-side only.
3. Search query/session is stored.
4. Results are not automatically copied into CRM.
5. Provider failures do not crash the app.
6. Existing CRM continues to work.
7. typecheck, lint, test, build pass.

MANDATORY HANDOFF
Update PROJECT_STATE.md.
Keep the final report under 40 lines.
```

---

# 24. Practical Business Priority

The project exists to produce customers.

Therefore use this priority:

```text
1. App runs reliably.
2. Real businesses can be discovered.
3. Selected businesses can enter CRM.
4. Follow-up is usable.
5. Measure whether outreach produces replies.
6. Only then add automated audit/scoring.
7. AI comes after reliable evidence exists.
```

Do not optimize technical sophistication before lead acquisition is proven.

---

# 25. Deployment Recommendation — Later, Not Now

For now:

```text
Local development + GitHub
```

After discovery is working and real leads are being used:

```text
Managed Postgres
+
production Next.js hosting
+
HTTPS
+
backup
```

Do not choose production hosting until the MVP has a reason to be online continuously.

---

# 26. Recommended Working Routine

Every feature:

```text
1. ChatGPT researches / reviews need.
2. ChatGPT writes one scoped .md task.
3. Codex creates a branch.
4. Codex reads PROJECT_STATE.md.
5. Codex implements only requested scope.
6. Codex runs checks.
7. Codex updates PROJECT_STATE.md.
8. Commit/push.
9. ChatGPT reviews Git diff / PR.
10. Merge to main.
```

This should replace:

```text
edit → zip whole project → upload → reread everything
```

---

# 27. Definition of Done

A task is DONE only if:

```text
requested behavior works
+
typecheck passes
+
lint passes
+
tests pass
+
build passes
+
PROJECT_STATE.md updated
+
no secrets committed
```

If one check cannot run:

```text
task status = BLOCKED or PARTIAL
```

not DONE.

---

# 28. Current Recommended Next Action

Do **Task A only**.

Do not start Google Places until the clean local environment, GitHub baseline, and verification workflow are stable.

Once Task A passes, push the repo to GitHub and connect the GitHub repository to ChatGPT/Codex.

Then execute Task B.
