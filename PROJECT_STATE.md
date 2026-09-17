# SAOBEO LEAD — Project State

Last updated: 2026-09-17
Branch: main
Last commit: feat: add Google Places lead discovery (local, not pushed)

## Current Phase
Phase 2 — Discovery. Task A: DONE. Task A.1: DONE. Task B: CODE COMPLETE, LIVE ACCEPTANCE PENDING.

## Runtime
- Node.js 24.13.0 LTS; Next.js 16.3.5; Prisma 6.19.3.
- Docker Desktop + WSL 2; PostgreSQL 17 container healthy.

## Working
- Admin login verified; explicit submit control has a regression test.
- `npm run seed` loads `.env` directly and succeeds.
- Prisma migration verified (`migrate status`: up to date).
- Dashboard, leads, pipeline, activities and tasks from Phase 1.
- Private GitHub baseline exists.
- `/discover` supports preset location/industry searches through server-side Google Places (New) adapter.
- Search sessions retain place IDs and query metadata; `/lead-inbox` deduplicates by provider + place ID.
- Inbox qualification/rejection and user-confirmed CRM lead creation are implemented.

## Not Implemented
- Website audit, scoring, AI and public audit reports.

## Known Issues
- `.env` has no `GOOGLE_MAPS_API_KEY`; real Google search and full manual acceptance flow are not yet verified.
- Lead Inbox fetches live Google Place details for up to 10 items per page; this has per-view API cost.

## Verification
- Task A.1: typecheck PASS; lint PASS; tests PASS (2); build PASS; seed PASS; migration status PASS.
- Task B: migration applied; typecheck PASS; lint PASS; tests PASS (13, mocked Google); build PASS. Live Google flow PENDING.

## Last Completed Task
Task A.1 — seed loads `.env`; login submit regression test; baseline checks pass.

## Current Task
Task B code complete; waiting for a configured key and real-business acceptance.

## Next Task
Configure Places API (New) and `GOOGLE_MAPS_API_KEY` in local `.env`; manually verify Đà Lạt → Homestay → Inbox → CRM. Do not start website audit until real search quality is checked.

## Important Decisions
- Google API key remains server-only.
- Required environment variable for Task B: `GOOGLE_MAPS_API_KEY` (local `.env` only).
- Google place ID may be retained; other Places content is fetched when displayed and not stored as a permanent provider mirror.
- No automated outreach or phase 3+ features.
