# SAOBEO LEAD — TASK B.2
## Switch Places transport to RapidAPI Google Map Places (New V2)

Current state:
- CRM works.
- Direct Google Places adapter exists but Google billing/account blocks live use.
- RapidAPI Google Map Places (New V2) Text Search has been manually verified:
  - HTTP 200
  - query `homestay Đà Lạt`
  - real places returned
  - response contains `places[].id`, `displayName.text`, `formattedAddress`
  - FieldMask is required.
- Keep existing direct Google code as fallback/reference.
- RapidAPI becomes the active Places transport for now.

# Goal
Make `/discover` work end-to-end through RapidAPI without changing CRM/Lead Inbox behavior.

Flow:
`Đà Lạt → Homestay → Search → real places → Lead Inbox → Qualify → Create CRM Lead`

# Scope
Implement only:
- RapidAPI config
- RapidAPI Places Text Search transport
- normalization into existing discovery result model
- safe provider error logs
- tests
- PROJECT_STATE update

Do NOT add:
- provider selector UI
- AI
- website audit changes
- PageSpeed
- scoring
- auto outreach
- Redis/BullMQ
- proposal/demo generator
- broad refactors

# Environment
Add to `.env.example`:

```env
PLACES_TRANSPORT="rapidapi"
RAPIDAPI_KEY=""
RAPIDAPI_HOST=""
```

Never expose keys client-side. Never commit `.env`.

The exact `RAPIDAPI_HOST` and endpoint must come from the RapidAPI Code Snippet for this listing. Do not guess them.

# Authentication
RapidAPI requests require:
- `X-RapidAPI-Key`
- `X-RapidAPI-Host`

Fail clearly if either is missing.

# Text Search
Keep request minimal:

```json
{
  "textQuery": "homestay Đà Lạt",
  "pageSize": 20
}
```

Use FieldMask:

```text
places.id,places.displayName,places.formattedAddress
```

Do not request photos or review text in this task.

# Normalization
Expected source shape:

```json
{
  "places": [
    {
      "id": "...",
      "displayName": {"text": "...", "languageCode": "vi"},
      "formattedAddress": "..."
    }
  ]
}
```

Normalize to the existing app model:

```ts
{
  provider: "google_places",
  externalId: place.id,
  name: place.displayName?.text ?? "",
  address: place.formattedAddress ?? "",
  industry: selectedIndustry,
  websiteUrl: null,
  phone: null,
  rating: null,
  reviewCount: null
}
```

Important: transport must NOT define business identity.

Use:
- canonical source/provider = `google_places`
- externalId = Google Place ID

This prevents duplicates if switching between direct Google and RapidAPI.

# Design
Prefer:

```text
PlacesService
  ↓
transport
  ├─ rapidapi       (active)
  └─ direct-google  (retained, disabled)
```

No provider dropdown in UI.

Config chooses transport:

```env
PLACES_TRANSPORT="rapidapi"
```

# Error logging
Improve current generic `error: "Error"` logs.

Log only:
- transport
- operation
- HTTP status
- provider error code/message if present
- duration

Never log:
- RapidAPI key
- Google key
- auth headers

UI remains concise Vietnamese.

# Rate limit awareness
Observed Basic plan:
- $0/month
- 100 requests/day
- hard limit

Therefore:
- one click = one search request
- no auto-search
- no fan-out query variants
- no auto-pagination
- default page size <= 20

# Tests
Mock RapidAPI. No live network calls.

Minimum:
- successful normalization
- empty result
- missing key
- missing host
- 401/403
- 429
- malformed response
- dedupe remains Google Place ID based

# Manual acceptance
With:

```env
PLACES_TRANSPORT="rapidapi"
RAPIDAPI_KEY="..."
RAPIDAPI_HOST="..."
```

Test:
1. `/discover`
2. Đà Lạt
3. Homestay
4. 20
5. real businesses appear
6. add one to Lead Inbox
7. duplicate add blocked
8. qualify
9. Create CRM Lead
10. lead appears in Leads

# Definition of Done
All pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Manual acceptance must pass.

# Git
Commit:

```text
feat: use RapidAPI transport for Places discovery
```

Do not commit `.env`, secrets, `node_modules`, `.next`.

# PROJECT_STATE.md
Update concise state:
- RapidAPI transport active
- direct Google transport retained but disabled
- live discovery verified
- Lead Inbox verified
- CRM creation verified
- Basic limit: 100 req/day
- next task

# CODEX PROMPT

```text
Read PROJECT_STATE.md first.
Then read SAOBEO-LEAD-TASK-B2-RAPIDAPI.md completely.

GOAL
Make existing Places discovery work through RapidAPI Google Map Places (New V2), while keeping existing CRM/Lead Inbox behavior unchanged.

VERIFIED FACTS
- RapidAPI Text Search returns HTTP 200.
- `homestay Đà Lạt` returns real places.
- Response includes places[].id, displayName.text, formattedAddress.
- FieldMask is required.
- Basic plan hard limit is 100 requests/day.

IMPLEMENT ONLY
1. RapidAPI server-side config.
2. RapidAPI Text Search transport.
3. Normalize into existing discovery model.
4. Preserve identity by Google Place ID/source, not transport.
5. Improve safe provider error logs.
6. Minimal tests.

DO NOT
- change CRM UX;
- add provider selector;
- add AI/audit/scoring;
- add Redis/queues;
- request photos/review text;
- auto-run or fan-out searches;
- delete existing direct Google adapter.

IMPORTANT
- Get exact endpoint and X-RapidAPI-Host from the RapidAPI Code Snippet/local config. Do not invent them.
- Keep secrets server-side.
- Do not log secrets.
- Use minimal FieldMask.
- Avoid duplicate leads when switching transport.

BEFORE CODING
Return only:
1. files to inspect/change;
2. env variables;
3. transport design;
4. dedupe identity design;
5. assumptions.

Then implement.

VERIFY
- npm run typecheck
- npm run lint
- npm test
- npm run build

MANUAL ACCEPTANCE
Đà Lạt → Homestay → real results → Lead Inbox → qualify → Create CRM Lead.

AFTER CODING
1. Update PROJECT_STATE.md.
2. Report exact verification results.
3. Report manual setup still required.
4. Commit:
   feat: use RapidAPI transport for Places discovery

Do not start another task.
```
