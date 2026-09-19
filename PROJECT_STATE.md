# SAOBEO LEAD — Project State

Last updated: 2026-09-19
Branch: main
Last commit: `d32d6c6 feat: add evidence-based sales assistant` (pushed)

## Current Phase
Phase 3 — Public Audit Report. Task G code complete; manual report acceptance pending.

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
- Lead Detail computes a concise, deterministic opportunity list and contact summary from CRM data plus the latest successful audit.
- Lead Detail and Leads list compute an explainable 0–100 priority score with HOT/WARM/LOW/CLOSED bands.
- Leads can be filtered by priority and sorted dynamically without persisted scores.
- Discovery Text Search uses a hard geographic restriction plus defensive Haversine/address filtering for preset sales areas.
- `/discover?session=...` restores accepted results after refresh without another provider request.
- Text Search uses the required rectangular `locationRestriction`; server-side Haversine and address conflict filters remain active.
- `/discover` shows safe provider diagnostics and RapidAPI quota headers when supplied.
- Authenticated `/system-status` shows app, database, Places configuration, recent provider telemetry and latest Website Audit status without secrets.
- Lead Detail computes a deterministic sales strategy before any AI request and can create one evidence-based outreach draft per manual click.
- Sales drafts use OpenAI Responses API structured output, deterministic claim checks, workspace-scoped persistence, edit/copy/save controls and local objection responses with no auto-send.
- Lead Detail can intentionally create immutable, sanitized public report snapshots for social-only leads or successful website audits.
- Opaque `/r/[token]` links render without login, carry noindex/no-store controls, support revoke/expiry and conservatively count browser opens with 30-minute cookie dedupe.

## Not Implemented
- Demo generation, proposals and automated outreach.

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
- Task D: no migration; typecheck PASS; lint PASS; tests PASS (62); build PASS; diff check PASS. Lead with audit and lead without website manually verified.
- Task E: no migration; typecheck PASS; lint PASS; tests PASS (94); build PASS; diff check PASS. Social-profile classification patch applied; manual business-ranking acceptance PENDING.
- Task B4: no migration; typecheck PASS; lint PASS; tests PASS (104); build PASS; diff check PASS. Manual geo/F5 acceptance PENDING.
- Task B4.1: minimal ProviderRequestLog migration applied; typecheck PASS; lint PASS; tests PASS (113); build PASS; migration status PASS; diff check PASS. Commit `d0a3eed` pushed and manually verified; Places HTTP 200, quota visible and `/system-status` working.
- Task F: OutreachDraft migration applied; messaging-quality patch adds three styles and Zalo/Facebook, phone and email outputs; typecheck PASS; lint PASS; tests PASS (138); build PASS; migration status PASS; diff check PASS. Commit `d32d6c6` pushed.
- Task G: PublicAuditReport/View migration applied; typecheck PASS; lint PASS; tests PASS (154); build PASS; migration status PASS; diff check PASS. Manual acceptance PENDING.

## Last Completed Task
Task F — Evidence-based Sales Assistant (`d32d6c6`, pushed).

## Current Task
Task G code complete. Public report manual acceptance remains required before commit.

## Next Task
Await the next explicitly assigned task.

## Important Decisions
- Google API key remains server-only.
- Required RapidAPI variables: `PLACES_TRANSPORT`, `RAPIDAPI_KEY`, `RAPIDAPI_HOST` (local `.env` only).
- Google place ID remains the canonical provider identity; only selected enrichment fields are persisted.
- Task B.3 commit `f6980d5` is pushed to GitHub; RapidAPI Text Search, Place Details, Inbox enrichment and CRM autofill are live verified.
- Task C commit `458a397` is pushed to GitHub and Website Audit is live verified.
- Task D commit `9885e5f` is pushed to GitHub and Opportunity Engine is verified.
- Website Audit stores concise checks/findings and never stores full HTML.
- Opportunities are computed dynamically; Task D adds no persistence or numeric score.
- Priority scores are computed dynamically; Task E adds no persistence and does not represent conversion probability.
- Known social-platform URLs are preserved as contact channels but are not treated or audited as standalone websites.
- Discovery search-area radii are operational sales zones with a 5 km filter tolerance and must be tuned only from local acceptance evidence.
- Provider telemetry stores only safe status metadata and quota snapshots; it never stores API keys or authentication headers.
- Sales Assistant sends only compact verified context, stores no hidden prompt or secret, and never sends outreach automatically.
- Customer-facing drafts reject internal labels/provider language, limit first-contact questions and keep detailed discovery questions for after a prospect replies.
- Public reports are immutable sanitized snapshots; public page views never read mutable Lead/CRM data and report creation/view never calls OpenAI.
- No automated outreach or phase 3+ features.
