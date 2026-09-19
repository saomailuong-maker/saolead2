# SAOBEO LEAD — Project State

Last updated: 2026-09-19
Branch: main
Last commit: feat: enrich Lead Inbox with RapidAPI Place Details (local, not pushed)

## Current Phase
Phase 2 — Discovery. Task B.3 complete.

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
- RapidAPI Text Search is live verified with Đà Lạt → Homestay.
- RapidAPI Place Details enriches only businesses selected into Lead Inbox.
- Lead Inbox persists and displays phone, website, rating, review count, opening hours and enrichment status.
- CRM creation copies enriched phone and website; Direct Google details is disabled while RapidAPI transport is active.

## Not Implemented
- Website audit, scoring, AI and public audit reports.

## Known Issues
- RapidAPI Basic plan has a hard limit of 100 requests/day.
- Email is not supplied by Places and remains manual until Website Audit enrichment.

## Verification
- Task A.1: typecheck PASS; lint PASS; tests PASS (2); build PASS; seed PASS; migration status PASS.
- Task B: migration applied; typecheck PASS; lint PASS; tests PASS (13, mocked Google); build PASS. Live Google flow PENDING.
- Task B.2: RapidAPI Text Search live verified.
- Task B.3: migration applied; typecheck PASS; lint PASS; tests PASS (28); build PASS; diff check PASS. Live Đà Lạt → Homestay → Inbox enrichment → CRM phone/website autofill PASS.

## Last Completed Task
Task B.3 — RapidAPI Place Details enrichment and CRM phone/website autofill.

## Current Task
Task B.3 complete; RapidAPI controls Text Search and Place Details.

## Next Task
Await the next explicitly assigned task.

## Important Decisions
- Google API key remains server-only.
- Required RapidAPI variables: `PLACES_TRANSPORT`, `RAPIDAPI_KEY`, `RAPIDAPI_HOST` (local `.env` only).
- Google place ID remains the canonical provider identity; only selected enrichment fields are persisted.
- No automated outreach or phase 3+ features.
