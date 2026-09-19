# SAOBEO LEAD — TASK B3
## RapidAPI Place Details Enrichment + CRM Autofill

## CURRENT STATE

- CRM works.
- RapidAPI Text Search (New) works.
- `/discover` returns real businesses.
- Lead Inbox works.
- CRM lead creation works.
- Current problem:
  - Lead Inbox still tries to use direct Google Place Details.
  - Direct Google returns 403.
  - Phone / website / rating are therefore not enriched.
  - CRM lead detail requires manual entry for phone and website.
- `PLACES_TRANSPORT="rapidapi"` must control BOTH Text Search and Place Details.

---

# 1. GOAL

When a user adds a search result to Lead Inbox, SAOBEO LEAD should enrich that place through RapidAPI Place Details (New).

Automatically populate, when available:

```text
phone
website
rating
review count
opening hours
```

Then when the user creates the CRM Lead, the CRM form must already contain:

```text
business name
industry
location
phone
website
```

Email remains empty unless already manually known.

Do NOT attempt email enrichment in this task.

---

# 2. DESIRED FLOW

```text
Text Search
↓
Name + address + Google Place ID
↓
User clicks "Đưa vào Lead Inbox"
↓
RapidAPI Place Details (1 request)
↓
Enrich discovered business
↓
Lead Inbox shows:
- phone
- website
- rating
- review count
- opening hours
↓
User Qualifies
↓
Create CRM Lead
↓
CRM lead auto-filled with phone + website
```

If Place Details fails:

```text
Keep the basic lead.
Show "Chưa tải được thông tin chi tiết".
Allow Create CRM Lead anyway.
```

---

# 3. IMPORTANT COST RULE

Do NOT call Place Details for all Text Search results.

Only call Place Details when:

```text
user adds a place to Lead Inbox
```

One search + five selected businesses should consume approximately:

```text
1 Text Search request
+
5 Place Details requests
=
6 total requests
```

Do not auto-enrich search results.

---

# 4. RAPIDAPI PLACE DETAILS

Use the RapidAPI listing:

```text
Google Map Places (New V2)
```

Endpoint:

```text
Place Details (New)
```

IMPORTANT:

Do NOT guess the endpoint URL.

Codex must obtain the exact endpoint path from:
- existing RapidAPI documentation/snippet supplied by the user, OR
- a clearly configurable environment/path value.

If the exact Place Details request URL is not already present in the project/task context, STOP before implementation and ask only for:

```text
Place Details Request URL
X-RapidAPI-Host
```

Do NOT ask for the API key.

---

# 5. AUTH

Reuse:

```env
PLACES_TRANSPORT="rapidapi"
RAPIDAPI_KEY="..."
RAPIDAPI_HOST="google-map-places-new-v2.p.rapidapi.com"
```

Server-side only.

Never log secrets.

---

# 6. FIELD MASK

Request only the fields needed for enrichment.

Preferred fields:

```text
id
displayName
formattedAddress
nationalPhoneNumber
internationalPhoneNumber
websiteUri
rating
userRatingCount
regularOpeningHours
businessStatus
```

Use the smallest valid FieldMask supported by the RapidAPI Place Details endpoint.

Do NOT request:
- photos
- reviews text
- editorial summaries
- unnecessary fields

---

# 7. NORMALIZATION

Normalize Place Details into the existing internal model.

Concept:

```ts
type PlaceDetailsEnrichment = {
  sourceSystem: "google_places";
  externalId: string;
  phone?: string | null;
  internationalPhone?: string | null;
  websiteUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  openingHours?: unknown | null;
  businessStatus?: string | null;
};
```

Prefer:

```text
nationalPhoneNumber
```

as the CRM phone field.

Fallback:

```text
internationalPhoneNumber
```

if national phone is missing.

---

# 8. DATABASE

Reuse existing discovery / Lead Inbox tables where practical.

Add only minimal fields if missing:

```text
phone
website_url
rating
review_count
opening_hours_json
details_status
details_fetched_at
details_error_code
```

Do NOT add a large new enrichment subsystem.

Suggested details status:

```text
NOT_FETCHED
SUCCESS
FAILED
```

---

# 9. LEAD INBOX UI

Show, when available:

```text
Tên doanh nghiệp
Địa chỉ
Ngành
Điện thoại
Website
Rating
Số đánh giá
Giờ mở cửa
Trạng thái enrichment
```

If no details:

```text
Chưa tải được thông tin chi tiết
```

If Place Details fails:

```text
Không tải được thông tin chi tiết.
Vẫn có thể tạo CRM Lead.
```

Do not show technical provider error messages to the user.

---

# 10. CRM AUTOFILL

When Create CRM Lead is clicked:

Copy:

```text
business_name
industry
location
phone
website
source
```

from the enriched Inbox item.

CRM fields:

```text
Phone
Website
```

must appear automatically populated.

Do NOT auto-populate email in this task.

---

# 11. DIRECT GOOGLE BUG

Current problem observed:

```text
transport: direct-google
operation: details
HTTP 403
```

Fix transport selection so:

```text
PLACES_TRANSPORT="rapidapi"
```

means BOTH:

```text
Text Search → RapidAPI
Place Details → RapidAPI
```

Direct Google adapter may remain in the repository, but must not be invoked when the configured transport is `rapidapi`.

Add a regression test for this.

---

# 12. ERROR HANDLING

Handle:

```text
missing RAPIDAPI_KEY
missing RAPIDAPI_HOST
401
403
404
429
timeout
invalid response
empty response
```

Do not block the CRM workflow if Place Details fails.

Safe server log fields:

```text
transport
operation
httpStatus
providerCode
providerMessage
durationMs
externalId/placeId
```

Never log:
- API key
- auth headers

---

# 13. TESTS

Minimum automated tests:

### Transport routing
- `PLACES_TRANSPORT=rapidapi` routes Text Search to RapidAPI
- `PLACES_TRANSPORT=rapidapi` routes Place Details to RapidAPI
- direct Google Place Details is NOT called

### Details normalization
- phone
- website
- rating
- review count
- opening hours
- missing optional fields

### Failure
- 403
- 429
- malformed response
- timeout
- details failure still permits CRM Lead creation

### CRM
- enriched phone copies to CRM
- enriched website copies to CRM
- email remains unchanged/empty

No live RapidAPI calls in automated tests.

---

# 14. MANUAL ACCEPTANCE

Use a real place returned from:

```text
Đà Lạt → Homestay
```

Flow:

```text
1. Search
2. Add result to Lead Inbox
3. Confirm Place Details executes through RapidAPI
4. Inbox shows phone and/or website if provider returns them
5. Qualify
6. Create CRM Lead
7. Open CRM Lead
8. Phone and Website are already populated
```

If a selected business does not have a phone or website on Google, test another place before concluding the feature is broken.

---

# 15. DEFINITION OF DONE

All pass:

```bash
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

Manual acceptance passes for at least one real business that has phone or website data.

---

# 16. GIT

Commit:

```text
feat: enrich Lead Inbox with RapidAPI Place Details
```

Do not commit:

```text
.env
API keys
node_modules
.next
```

Push only after manual acceptance.

---

# 17. PROJECT_STATE.md

Update:

```text
Task B2:
RapidAPI Text Search live verified

Task B3:
RapidAPI Place Details active
Lead Inbox enrichment verified
CRM phone/website autofill verified
Direct Google details disabled when RapidAPI transport active

Known limitation:
Email is not supplied by Places and remains manual until Website Audit enrichment.
```

Keep concise.

---

# 18. CODEX PROMPT

```text
Read PROJECT_STATE.md first.
Then read SAOBEO-LEAD-TASK-B3-PLACE-DETAILS.md completely.

GOAL
Use RapidAPI Place Details to enrich only businesses selected into Lead Inbox, then auto-fill CRM phone and website.

CURRENT BUG
Text Search uses RapidAPI correctly, but Lead Inbox still calls direct Google Place Details and receives HTTP 403.

IMPLEMENT ONLY
1. Route Place Details through RapidAPI when PLACES_TRANSPORT=rapidapi.
2. Request minimal details fields.
3. Enrich selected Lead Inbox item only.
4. Persist phone, website, rating, review count, opening hours/status.
5. Auto-fill CRM phone and website.
6. Gracefully continue if details enrichment fails.
7. Add focused tests.

DO NOT
- enrich every search result;
- add email scraping;
- add AI;
- add website audit changes;
- add scoring;
- add screenshots;
- add photos/reviews;
- add provider selector;
- delete direct Google adapter;
- refactor unrelated CRM code.

IMPORTANT
- Reuse RAPIDAPI_KEY and RAPIDAPI_HOST.
- Get the exact Place Details endpoint from the RapidAPI Code Snippet. Do not invent it.
- If the exact Place Details Request URL is not available, stop and ask only for that URL and X-RapidAPI-Host. Do not ask for API key.
- Keep Google Place ID as canonical identity.
- Never log secrets.

BEFORE CODING
Return only:
1. files to inspect/change;
2. DB changes if needed;
3. details request fields;
4. transport routing plan;
5. assumptions.

Then implement.

VERIFY
- npm run typecheck
- npm run lint
- npm test
- npm run build
- git diff --check

MANUAL ACCEPTANCE
Đà Lạt → Homestay → Add to Lead Inbox → RapidAPI Place Details → Qualify → Create CRM Lead → phone/website auto-filled.

AFTER CODING
1. Update PROJECT_STATE.md.
2. Report exact verification results.
3. Report any manual config still required.
4. Commit:
   feat: enrich Lead Inbox with RapidAPI Place Details

Do not start another task.
```
