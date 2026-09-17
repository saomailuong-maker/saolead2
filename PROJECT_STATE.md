# SAOBEO LEAD — Project State

Last updated: 2026-09-17
Branch: main
Last commit: c7da91c (GitHub baseline; Task A.1 commit pending)

## Current Phase
Phase 2 — Discovery. Task A: DONE. Task A.1: DONE.

## Runtime
- Node.js 24.13.0 LTS; Next.js 16.3.5; Prisma 6.19.3.
- Docker Desktop + WSL 2; PostgreSQL 17 container healthy.

## Working
- Admin login verified; explicit submit control has a regression test.
- `npm run seed` loads `.env` directly and succeeds.
- Prisma migration verified (`migrate status`: up to date).
- Dashboard, leads, pipeline, activities and tasks from Phase 1.
- Private GitHub baseline exists.

## Not Implemented
- Discovery/Lead Inbox (current Task B), website audit, scoring, AI and public audit reports.

## Known Issues
- No reproducible baseline issue after Task A.1.

## Verification
- Task A.1: typecheck PASS; lint PASS; tests PASS (2); build PASS; seed PASS; migration status PASS.
- Task B: pending.

## Last Completed Task
Task A.1 — seed loads `.env`; login submit regression test; baseline checks pass.

## Current Task
Task B — Google Places Discovery and Lead Inbox only.

## Next Task
After Task B, manually verify Đà Lạt → Homestay → Inbox → CRM with a configured Google API key. Do not start website audit until real search quality is checked.

## Important Decisions
- Google API key remains server-only.
- Google place ID may be retained; other Places content is fetched when displayed and not stored as a permanent provider mirror.
- No automated outreach or phase 3+ features.
