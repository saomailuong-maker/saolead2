# SAOBEO LEAD — NEXT STEP
## Task A.1 + Task B: Baseline Hardening & Google Places Discovery

**Current status**
- Docker/PostgreSQL: working
- Prisma migration: working
- Admin seed: working after manual env injection
- Login: working after explicit submit button fix
- Dashboard/CRM Phase 1: working
- GitHub baseline: pushed
- Next goal: find real local businesses and move selected ones into Lead Inbox

---

# 1. IMPORTANT WORKING RULE

Do NOT expand scope.

This task has only 2 parts:

1. Fix two small baseline issues.
2. Implement Google Places Discovery + Lead Inbox.

Do NOT implement:
- AI
- website audit
- PageSpeed
- Wappalyzer
- BuiltWith
- auto-email
- Zalo sending
- Facebook automation
- scoring
- proposal generator
- demo generator
- Redis
- BullMQ
- background worker architecture
- SaaS/multi-tenant billing

Keep the implementation simple and usable.

---

# 2. TASK A.1 — HARDEN CURRENT BASELINE

## Goal

Make the currently working local setup reproducible without manual workarounds.

## Fix 1 — Login submit

Ensure login form button explicitly uses:

```tsx
type="submit"
```

Add/keep a regression test that verifies the login form has a real submit control.

Do not redesign login UI.

## Fix 2 — Seed must load `.env`

Current problem:

```bash
npm run seed
```

does not automatically receive:

```text
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_NAME
```

and required manual PowerShell `$env:` injection.

Fix seed so:

```bash
npm run seed
```

works directly after `.env` exists.

Preferred simple solution:
- load `.env` explicitly in seed entrypoint using a minimal dependency already available if possible;
- otherwise add `dotenv` only if required.

Do NOT add a large config framework.

## Verify

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run seed
```

Do not use:

```bash
npm audit fix --force
```

in this task.

---

# 3. UPDATE PROJECT_STATE.md BEFORE TASK B

Update:

```md
Current Phase: Phase 2 — Discovery
Task A: DONE
```

Record:
- Node 24 LTS
- Docker Desktop + WSL2
- PostgreSQL container
- migration verified
- seed verified
- login verified
- GitHub baseline created

Keep PROJECT_STATE concise.

---

# 4. TASK B — GOOGLE PLACES DISCOVERY

## Business goal

User must be able to:

```text
Choose location
+
Choose industry
+
Search
↓
See real businesses
↓
Select a business
↓
Move it into Lead Inbox
```

This is the first business-useful feature.

Do not build CRM enrichment yet.

---

# 5. UI

Add navigation:

```text
Tổng quan
Tìm khách hàng
Lead Inbox
Leads
Pipeline
Công việc
```

Route:

```text
/discover
```

Page title:

```text
Tìm khách hàng
```

Search form:

```text
Khu vực
Ngành
Từ khóa bổ sung (optional)
Số kết quả tối đa
```

Initial location presets:

```text
Đức Trọng
Đà Lạt
Lâm Hà
Đơn Dương
Di Linh
Bảo Lộc
Lạc Dương
```

Initial industries:

```text
Homestay
Khách sạn
Cafe
Nhà hàng
Du lịch / Tour
Farm / Nông nghiệp
Cửa hàng nông nghiệp
Xây dựng
Nội thất
Spa
Nha khoa / Phòng khám
Bất động sản
```

Search button:

```text
Tìm khách hàng
```

---

# 6. GOOGLE PLACES PROVIDER

Use Google Places API (New), server-side only.

Environment:

```text
GOOGLE_MAPS_API_KEY=
```

Add to:

```text
.env.example
```

Never expose key client-side.

Create a provider adapter.

Example concept:

```ts
interface BusinessDiscoveryProvider {
  search(input: SearchBusinessesInput): Promise<BusinessSearchResult[]>
}
```

Implementation:

```text
GooglePlacesDiscoveryProvider
```

Do not call Google directly from React components.

---

# 7. KEEP FIELD USAGE MINIMAL

Use only fields needed for discovery results.

Target fields:

```text
place id
display name
formatted address
primary type / types
business status if useful
website URI if available and cost-appropriate
national phone if available and cost-appropriate
rating if available and cost-appropriate
user rating count if available and cost-appropriate
```

IMPORTANT:

If adding website/phone/rating materially increases API SKU/cost, split into:

### Lightweight search

```text
place id
name
address
type
```

### Detail enrichment

only when user opens/selects a result.

Prefer cost control over convenience.

Keep field mask defined in one provider constant/file so it is easy to change.

---

# 8. SEARCH QUERY CONSTRUCTION

Do NOT let AI build query.

Use deterministic mapping.

Examples:

```text
Homestay + Đà Lạt
→ "homestay in Đà Lạt"

Xây dựng + Đức Trọng
→ "công ty xây dựng in Đức Trọng"

Farm + Đức Trọng
→ "farm nông nghiệp in Đức Trọng"
```

Allow optional additional keyword.

Do not generate dozens of automatic searches in one click.

One user search = one controlled provider operation in MVP.

---

# 9. SEARCH RESULT UI

Display table/cards with:

```text
Tên doanh nghiệp
Địa chỉ
Loại hình
Website status (if known)
Rating (if known)
Reviews (if known)
Source
Action
```

Actions:

```text
Xem
Đưa vào Lead Inbox
```

Do not create CRM lead immediately.

---

# 10. LEAD INBOX

Add route:

```text
/lead-inbox
```

Statuses:

```text
UNREVIEWED
QUALIFIED
REJECTED
CRM_CREATED
```

Display:

```text
Business
Location
Industry
Source
Website status
Added at
Status
```

Actions:

```text
Qualify
Reject
Create CRM Lead
```

---

# 11. DATABASE — MINIMAL ONLY

Add only the tables needed.

## search_sessions

Suggested:

```text
id
query
location
industry
provider
result_count
created_at
```

## discovered_businesses

Suggested:

```text
id
provider
external_id
name
address
industry
website_url nullable
phone nullable
rating nullable
review_count nullable
status
search_session_id
created_at
updated_at
```

Unique constraint:

```text
provider + external_id
```

Do not store raw full Google payload permanently unless needed.

If temporary provider metadata is needed, keep it minimal and policy-aware.

---

# 12. DEDUPLICATION

Before inserting Lead Inbox result:

```text
provider + external_id
```

must be unique.

If already in inbox:

show:

```text
Đã có trong Lead Inbox
```

Do not insert duplicate.

Later CRM dedupe can use domain/phone.

Not part of this task.

---

# 13. CREATE CRM LEAD

When user presses:

```text
Create CRM Lead
```

copy only required values into existing `leads` structure:

```text
business_name
industry
location
website
phone
source
```

Then:

```text
Lead Inbox status → CRM_CREATED
```

Do not change the existing CRM architecture unless strictly necessary.

---

# 14. API USAGE LOGGING

Keep this very simple.

Add `api_usage` only if implementation is lightweight.

Fields:

```text
provider
operation
created_at
```

Optional:

```text
estimated_cost nullable
```

Do not build dashboards for cost yet.

If adding the table creates unnecessary complexity, log provider requests in structured server logs and defer DB usage tracking.

---

# 15. ERROR HANDLING

### API key missing

Show:

```text
Google Places chưa được cấu hình.
Vui lòng thêm GOOGLE_MAPS_API_KEY.
```

### Provider error

Show:

```text
Không thể tìm doanh nghiệp lúc này.
Vui lòng thử lại.
```

Log technical error server-side.

Do not expose API keys/provider internals in UI.

### Empty

Show:

```text
Không tìm thấy doanh nghiệp phù hợp.
Thử đổi ngành hoặc khu vực.
```

---

# 16. SECURITY

Must:
- keep key server-only;
- validate inputs;
- limit max results;
- no arbitrary Google request body from browser;
- no unrestricted proxy endpoint;
- no raw provider response exposed unnecessarily.

Use Zod for request validation if project already uses it.

---

# 17. MVP LIMITS

Default:

```text
max results = 20
```

Allowed:

```text
10
20
40
```

Do not add pagination across hundreds of results yet.

Do not auto-run searches.

---

# 18. TESTS

Minimum:

## Unit
- query builder
- dedupe
- input validation

## Integration/provider mock
- successful Google response normalized correctly
- provider error handled
- missing API key handled

## UI
- search form renders
- Lead Inbox action works
- duplicate cannot be re-added

Do not hit live Google API in automated tests.

---

# 19. DEFINITION OF DONE

Task B is DONE only when this manual flow works:

```text
Open /discover
↓
Choose Đà Lạt
↓
Choose Homestay
↓
Search
↓
Real businesses appear
↓
Select one
↓
Add to Lead Inbox
↓
Open Lead Inbox
↓
Qualify
↓
Create CRM Lead
↓
Lead appears in existing Leads page
```

And these commands pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

---

# 20. PROJECT_STATE UPDATE

At completion record:

```text
Task B status
What works
Known limitation
Verification results
Required environment variables
Next task
Last commit
```

Keep it under ~100 lines if practical.

---

# 21. GIT

Use one focused commit for baseline fixes:

```text
fix: stabilize login and seed environment
```

Then one focused commit for Task B:

```text
feat: add Google Places lead discovery
```

Do not combine unrelated refactors.

Do not commit:

```text
.env
node_modules
.next
```

---

# 22. CODEX PROMPT — RUN THIS

```text
Read PROJECT_STATE.md first, then read this file.

GOAL
Complete Task A.1, then implement Task B Google Places Discovery.

CURRENT STATE
- CRM Phase 1 works.
- PostgreSQL/Docker works.
- Migration works.
- Login works after explicit submit button fix.
- Seed currently required manual environment injection.
- GitHub baseline already exists.

TASK A.1
1. Ensure login submit button explicitly uses type="submit".
2. Make `npm run seed` automatically load `.env`.
3. Add/adjust minimal regression tests.
4. Run typecheck, lint, test, build, and seed.
5. Update PROJECT_STATE.md.
6. Commit only these fixes:
   `fix: stabilize login and seed environment`

TASK B
Implement only:
- `/discover`
- Google Places server-side provider adapter
- deterministic location + industry query builder
- result list
- `/lead-inbox`
- deduplication by provider + external id
- qualify/reject
- create existing CRM lead from inbox item
- missing-key and provider-error states
- minimal tests

STRICTLY DO NOT IMPLEMENT
- AI
- website audit
- scoring
- PageSpeed
- email/Zalo/Facebook automation
- Redis/BullMQ
- demo/proposal generator
- SaaS billing
- broad refactors

TECHNICAL RULES
- API key server-side only.
- Add GOOGLE_MAPS_API_KEY to `.env.example`.
- Use minimal Google Places fields.
- No live Google calls in automated tests.
- Reuse existing UI/components/database conventions.
- Avoid new dependencies unless genuinely required.
- Do not rewrite working CRM modules.

BEFORE CODING
Return only:
1. files you need to inspect/change;
2. migration/table changes;
3. Google request fields you plan to request;
4. assumptions.

Then implement.

VERIFY
Run:
- npm run typecheck
- npm run lint
- npm test
- npm run build

MANUAL ACCEPTANCE FLOW
Đà Lạt → Homestay → search → real business → Lead Inbox → qualify → Create CRM Lead → appears in Leads.

AFTER CODING
1. Update PROJECT_STATE.md.
2. Report exact verification results.
3. List any required manual setup for Google API.
4. Commit:
   `feat: add Google Places lead discovery`

Do not start the next task.
```

---

# 23. MANUAL GOOGLE SETUP — USER SIDE

After Codex finishes Task B code, user will need a Google Cloud project.

Required high-level steps:

```text
Google Cloud Console
↓
Create/select project
↓
Enable Places API (New)
↓
Create API key
↓
Restrict API key
↓
Add billing if Google requires it for the API
↓
Put key in local .env
```

Local:

```env
GOOGLE_MAPS_API_KEY="YOUR_KEY"
```

Never add the real key to GitHub.

---

# 24. STOP CONDITION

Do not start website audit until user has successfully found real businesses and moved at least one into CRM.

The next product decision should be based on actual search results, not assumptions.

If discovery quality is weak, improve:
- query mappings;
- industry presets;
- location handling;
- result presentation;

before adding more architecture.
