# SAOBEO LEAD — Project State

Last updated: 2026-09-19
Branch: main
Last commit: feat: use RapidAPI transport for Places discovery (local, not pushed)

## Current Phase
Phase 2 — Discovery. Task B.2: CODE COMPLETE, LIVE ACCEPTANCE PENDING.

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
- RapidAPI Google Map Places (New V2) is the active Text Search transport.
- Direct Google transport remains available through configuration but is disabled by default.
- RapidAPI search performs one request per click, requests only place ID/name/address, and caps results at 20.

## Not Implemented
- Website audit, scoring, AI and public audit reports.

## Known Issues
- `.env` has no `RAPIDAPI_KEY`, `RAPIDAPI_HOST`, or `PLACES_TRANSPORT`; live RapidAPI discovery and full manual acceptance are not yet verified in this workspace.
- Lead Inbox fetches live Google Place details for up to 10 items per page; this has per-view API cost.
- RapidAPI Basic plan has a hard limit of 100 requests/day.

## Verification
- Task A.1: typecheck PASS; lint PASS; tests PASS (2); build PASS; seed PASS; migration status PASS.
- Task B: migration applied; typecheck PASS; lint PASS; tests PASS (13, mocked Google); build PASS. Live Google flow PENDING.
- Task B.2: typecheck PASS; lint PASS; tests PASS (19, mocked RapidAPI); build PASS. Live acceptance PENDING because no RapidAPI key is configured.

## Last Completed Task
Task A.1 — seed loads `.env`; login submit regression test; baseline checks pass.

## Current Task
Task B.2 code complete; RapidAPI transport is active by default and direct Google fallback is retained.

## Next Task
Configure `PLACES_TRANSPORT`, `RAPIDAPI_KEY`, and `RAPIDAPI_HOST`; manually verify Đà Lạt → Homestay → Inbox → CRM. Do not start website audit until real search quality is checked.

## Important Decisions
- Google API key remains server-only.
- Required RapidAPI variables: `PLACES_TRANSPORT`, `RAPIDAPI_KEY`, `RAPIDAPI_HOST` (local `.env` only).
- Google place ID may be retained; other Places content is fetched when displayed and not stored as a permanent provider mirror.
- No automated outreach or phase 3+ features.
