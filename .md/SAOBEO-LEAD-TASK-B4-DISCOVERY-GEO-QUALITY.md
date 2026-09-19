# SAOBEO LEAD — TASK B4
## Discovery Geo Quality Gate + Search Session Restore

## WHY THIS TASK EXISTS

Manual testing found a high-risk discovery quality issue:

Example:
- Search area: Đức Trọng
- Industry: Khách sạn
- A result named similarly to "Khách sạn Đức Trọng" appeared,
  but its physical address was in Hà Nội.

This is unacceptable for a local lead-generation tool because a wrong-location lead:
- wastes RapidAPI quota;
- pollutes Lead Inbox / CRM;
- makes priority scoring less trustworthy;
- can cause embarrassing outreach to the wrong market.

A second UX issue was also observed:
- search results disappear after browser refresh;
- SearchSession is already persisted, but `/discover` currently keeps displayed results only in `useActionState`.

This task fixes discovery quality BEFORE AI/outreach work.

---

# CURRENT CODE FACTS

Current query generation is text only:

```text
"<industry term> <keyword> <location>"
```

RapidAPI Text Search currently sends approximately:

```json
{
  "textQuery": "...",
  "pageSize": 20
}
```

Current Text Search FieldMask:

```text
places.id,places.displayName,places.formattedAddress
```

No geographic location restriction is currently sent.

Google Places Text Search supports `locationRestriction`, which means results must fall inside the supplied area.
`locationBias` is NOT sufficient because it may return places outside the selected area.

---

# 1. GOAL

For preset local searches:

```text
Đức Trọng
Đà Lạt
Lâm Hà
Đơn Dương
Di Linh
Bảo Lộc
Lạc Dương
```

return businesses that are physically relevant to the selected sales area.

Also make a completed search inspectable after refresh.

---

# 2. STRICT SCOPE

Implement ONLY:

1. static local search-area definitions;
2. Places Text Search `locationRestriction`;
3. request `places.location`;
4. defensive server-side geo filtering;
5. result quality metadata;
6. search session reload after refresh;
7. focused tests;
8. manual acceptance.

DO NOT:
- add another API provider;
- add geocoding API;
- add AI;
- add outreach;
- change CRM scoring weights;
- start Task F;
- add map UI unless trivial;
- create background jobs.

---

# 3. SEARCH AREA CONFIG

Create one reusable config module, e.g.:

```text
src/features/discovery/search-areas.ts
```

Suggested structure:

```ts
type SearchArea = {
  label: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radiusMeters: number;
  provinceTokens: string[];
  localityTokens: string[];
};
```

Use static, reviewed coordinates.

Suggested initial centers for manual validation:

```text
Đà Lạt
11.94646, 108.44193

Đức Trọng
11.69722, 108.31611

Lâm Hà
11.81554, 108.21444

Đơn Dương
11.75310, 108.55400

Di Linh
11.58165, 108.07633

Bảo Lộc
11.54806, 107.80750

Lạc Dương
12.00867, 108.41907
```

Initial radii should be conservative and easy to tune, approximately:

```text
Đà Lạt    25 km
Đức Trọng 30 km
Lâm Hà    35 km
Đơn Dương 30 km
Di Linh   35 km
Bảo Lộc   25 km
Lạc Dương 35 km
```

These are SALES SEARCH AREAS, not legal administrative boundaries.

Add a code comment stating that these values are operational search zones and must be manually tuned if local testing shows false positives/false negatives.

---

# 4. RAPIDAPI TEXT SEARCH REQUEST

Expand the search FieldMask to include:

```text
places.location
```

Result schema becomes approximately:

```ts
{
  id
  displayName
  formattedAddress
  location {
    latitude
    longitude
  }
}
```

Send:

```json
{
  "textQuery": "...",
  "languageCode": "vi",
  "regionCode": "VN",
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": "...",
        "longitude": "..."
      },
      "radius": "..."
    }
  },
  "pageSize": 20
}
```

IMPORTANT:
- use `locationRestriction`;
- do NOT use `locationBias` for these preset local sales searches;
- do NOT send both.

If this RapidAPI proxy rejects a valid Google-compatible `locationRestriction`,
stop and report the provider response instead of silently removing the restriction.

---

# 5. DEFENSIVE POST-FILTER

Do not rely only on provider ranking.

After response normalization, calculate Haversine distance:

```text
business coordinates
↔
selected search-area center
```

Reject results that are outside the configured radius plus a small documented tolerance.

Suggested:

```text
tolerance: 3–5 km
```

Also use address as a secondary sanity check.

At minimum:
- a formatted address explicitly containing Hà Nội, Hồ Chí Minh City, another province etc. must not pass a Đức Trọng/Lâm Đồng search;
- do not reject a legitimate border-area result solely because the string omits "Đức Trọng" if coordinates are inside the allowed zone.

Coordinates are the primary guard.
Address is secondary.

---

# 6. LOCATION QUALITY RESULT

Add internal metadata, e.g.:

```ts
type LocationQuality = {
  distanceKm: number | null;
  accepted: boolean;
  reason:
    | "WITHIN_AREA"
    | "OUTSIDE_AREA"
    | "MISSING_COORDINATES"
    | "ADDRESS_CONFLICT";
};
```

Normal UI only shows accepted results.

Log safe summary:

```json
{
  "event": "discovery_geo_filter",
  "location": "Đức Trọng",
  "providerCount": 20,
  "acceptedCount": 17,
  "rejectedCount": 3
}
```

Do NOT log API keys.

---

# 7. MISSING COORDINATES

Because `places.location` is requested, missing coordinates should be rare.

If coordinates are missing:
- do not automatically trust a result;
- accept only if formattedAddress clearly matches selected locality/province;
- otherwise reject.

The system should prefer a false negative over contacting a business in the wrong province.

---

# 8. SEARCH SESSION PERSISTENCE / F5

Current result display is client action state.
That is why F5 clears visible results even though SearchSession exists.

Fix this.

Preferred flow:

```text
Search
↓
SearchSession saved
↓
URL becomes /discover?session=<uuid>
↓
Refresh
↓
server validates workspace ownership
↓
restores that SearchSession's accepted results
```

Requirements:
- session must belong to current workspace;
- do not allow reading another workspace's session;
- do not re-call RapidAPI on refresh;
- use persisted `resultsJson`;
- keep "in Lead Inbox" status current when reloading.

If implementing the exact query-param flow conflicts with existing Next.js form architecture, use the smallest equivalent design.

---

# 9. QUERY / SEARCH SESSION DATA

Persist accepted results only in the normal result list.

Optionally store rejected count / quality info in SearchSession if schema already makes this simple.

Do not create a large analytics migration just for B4.

No migration is preferred.

---

# 10. TESTS

Minimum:

## Request
- Đức Trọng request includes `locationRestriction`
- request includes languageCode vi
- request includes regionCode VN
- FieldMask includes `places.location`

## Geo filter
- Đức Trọng-coordinate business accepted
- Hà Nội-coordinate business rejected even if its NAME contains "Đức Trọng"
- result just within tolerance accepted
- result far outside area rejected
- missing coordinates + matching local address handled
- missing coordinates + conflicting address rejected

## Security / workspace
- refreshed SearchSession must belong to current workspace

## Restore
- search results survive refresh without another provider request

## Regression
- RapidAPI Text Search still uses one request per user click
- Inbox add still uses canonical Google Place ID

---

# 11. MANUAL ACCEPTANCE — REQUIRED

Do NOT mark B4 DONE from mocks only.

User must test:

```text
Đức Trọng → Khách sạn
```

Run at least 3 searches.

Verify:
- no Hà Nội / other-province results;
- legitimate Đức Trọng businesses still appear;
- F5 retains the selected search session/results;
- no extra RapidAPI request occurs on F5.

Also test:

```text
Đà Lạt → Homestay
```

to ensure geo filtering did not become too strict.

If a legitimate business near an area boundary disappears:
- report its name/address;
- tune radius/tolerance deliberately.

---

# 12. PROJECT STATE / GIT

Before coding, inspect current local state.

IMPORTANT:
The remote GitHub main branch may still be behind local Task E work.

Do NOT rewrite or discard local Task E changes.

B4 should be a focused follow-up commit after resolving any local branch state.

Commit:

```text
fix: enforce local discovery geography
```

Do not push until manual geo acceptance passes.

---

# 13. CODEX PROMPT

```text
Read PROJECT_STATE.md first.

Inspect:
- src/features/discovery/query.ts
- src/features/discovery/provider.ts
- src/features/discovery/actions.ts
- src/features/discovery/search-form.tsx
- SearchSession Prisma model
- current local Task E changes; do not discard them

Then read SAOBEO-LEAD-TASK-B4-DISCOVERY-GEO-QUALITY.md completely.

GOAL
Prevent out-of-area Places results from entering the local sales workflow and make a search inspectable after refresh.

ROOT CAUSE TO ADDRESS
The current RapidAPI Text Search sends only textQuery + pageSize. A location name in text is not a hard geographic boundary. Add an actual geographic restriction plus defensive post-filtering.

IMPLEMENT ONLY
1. static search area config;
2. Text Search locationRestriction;
3. places.location response field;
4. Haversine/post-filter quality gate;
5. safe geo-quality logs;
6. SearchSession restore after F5;
7. focused tests.

IMPORTANT
- use locationRestriction, not locationBias;
- coordinates are primary validation;
- address is secondary validation;
- prefer rejecting uncertain remote results over polluting CRM;
- no extra provider request on refresh;
- preserve canonical Google Place ID;
- do not start AI/outreach work.

AUTOMATED VERIFY
- npm run typecheck
- npm run lint
- npm test
- npm run build
- git diff --check

MANUAL TEST GATE
Then STOP and ask the user to test:
1. Đức Trọng → Khách sạn, three times;
2. verify no Hà Nội / other-province result;
3. F5 and verify results remain;
4. verify F5 does not consume another API request;
5. Đà Lạt → Homestay regression.

Do not mark DONE or push until manual geo acceptance passes.
```
