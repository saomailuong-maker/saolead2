# SAOBEO LEAD — Project State

Last updated: 2026-09-19
Branch: main
Last commit: feat: add website audit MVP (local, not pushed)

## Current Phase
Phase 2 — Discovery and Website Audit. Task C complete.

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
- Lead Detail can run and persist a server-side homepage Website Audit with HTTP, SEO, contact/conversion and structure evidence.
- Website Audit rejects private/reserved targets and revalidates every redirect.

## Not Implemented
- Opportunity rules, scoring, AI and public audit reports.

## Known Issues
- RapidAPI Basic plan has a hard limit of 100 requests/day.
- Email remains manual; Task C does not perform email enrichment.
- Website Audit only evaluates returned homepage HTML; JavaScript-rendered content and other pages are not scanned.

## Verification
- Task A.1: typecheck PASS; lint PASS; tests PASS (2); build PASS; seed PASS; migration status PASS.
- Task B: migration applied; typecheck PASS; lint PASS; tests PASS (13, mocked Google); build PASS. Live Google flow PENDING.
- Task B.2: RapidAPI Text Search live verified.
- Task B.3: migration applied; typecheck PASS; lint PASS; tests PASS (28); build PASS; diff check PASS. Live Đà Lạt → Homestay → Inbox enrichment → CRM phone/website autofill PASS.
- Task C: migration applied; typecheck PASS; lint PASS; tests PASS (54); build PASS; migration status PASS; diff check PASS. Public website scan persisted/redisplayed and private-target rejection manually verified.

## Last Completed Task
Task C — Website Audit MVP.

## Current Task
Task C complete; deterministic homepage audit is available on Lead Detail.

## Next Task
Await the next explicitly assigned task.

## Important Decisions
- Google API key remains server-only.
- Required RapidAPI variables: `PLACES_TRANSPORT`, `RAPIDAPI_KEY`, `RAPIDAPI_HOST` (local `.env` only).
- Google place ID remains the canonical provider identity; only selected enrichment fields are persisted.
- Task B.3 commit `f6980d5` is pushed to GitHub; RapidAPI Text Search, Place Details, Inbox enrichment and CRM autofill are live verified.
- Website Audit stores concise checks/findings and never stores full HTML.
- No automated outreach or phase 3+ features.
