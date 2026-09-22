# SAOBEO LEAD — TASK H3
## Discovery History & Find New Leads

**Phase:** Phase 3 — Discovery Infrastructure Hardening  
**Status:** Implemented & Verified  
**Date:** 2026-09-21  

---

## 1. Why This Task Exists

Before this task, Discovery suffered from a critical business bottleneck:
- Searching the same area + industry (e.g. "Đà Lạt" + "Homestay") always returned the same top 20 results according to Google Places ranking.
- Each repeat search burned 1 API request from the RapidAPI Basic plan (100 req/day hard limit) while yielding 100% duplicate businesses.
- Places that appeared in search but were not added to Lead Inbox were lost in JSON logs, leaving no global index of seen places.
- Refreshing or revisiting `/discover` without a session parameter showed an empty screen with no access to previous queries.

This task resolves these issues by turning Discovery into a sustainable acquisition engine with:
1. Persistent Seen Places (`DiscoverySeenPlace`).
2. Quota-Safe "Find New Leads" loop (capped at max 3 requests).
3. Google Places `nextPageToken` pagination + sub-locality diversification.
4. Persistent Search History with 0-quota instant session restoration.
5. 5-state visual lead classification badges (`Mới`, `Đã xem (xN)`, `Đang ở Inbox`, `Đã loại`, `Đã có CRM`).

---

## 2. Architecture & Data Model

### 2.1 Prisma Schema Migration

Migration: `20260921071205_add_discovery_seen_place_and_history`

- **`DiscoverySeenPlace`**:
  - `workspaceId`: Scoped to workspace.
  - `provider`: `"google_places"`.
  - `externalId`: Google Place ID (unique per workspace + provider).
  - `name`, `address`, `location`, `industry`.
  - `seenCount`: Incremented on each appearance.
  - `firstSeenAt`, `lastSeenAt`, `lastSearchSessionId`.

- **`SearchSession` Enhancements**:
  - `nextPageToken`: String?
  - `mode`: `"STANDARD"` | `"FIND_NEW"`.
  - `searchStats`: Json? (`{ totalReturned, newFound, skippedSeen, requestsUsed }`).

### 2.2 Provider Enhancements (`provider.ts`)

- `SEARCH_FIELD_MASK`: Includes `nextPageToken` alongside place properties.
- `searchResponseSchema`: Parses `nextPageToken?: string | null`.
- `searchBody`: Passes optional `pageToken` and `customQuery`.
- `searchWithPagination`: Returns `{ results: BusinessSearchResult[], nextPageToken: string | null }`.
- `search`: Preserved for backward compatibility, returning `BusinessSearchResult[]`.

### 2.3 Find New Leads Engine (`find-new.ts`)

- Multi-step execution with a **hard quota guardrail**:
  - Never exceeds 3 API requests per click.
  - Automatically deduplicates against `DiscoverySeenPlace` records.
  - Request 1: Standard query.
  - Request 2+: Uses `nextPageToken` if returned by provider; otherwise falls back to query diversification via `areaSubLocalities` (e.g. "trung tâm", "Hồ Xuân Hương", "Trại Mát" for Đà Lạt).
  - Stops early once target count is reached.
  - Gracefully handles rate-limit or network errors on subsequent calls by returning accumulated results.

### 2.4 Status Resolution & Badges (`seen-places.ts`)

Cross-references `Lead`, `DiscoveredBusiness`, and `DiscoverySeenPlace` to assign 5 visual badges:
1. `CRM`: Business already converted into a CRM Lead.
2. `INBOX`: Business currently in Lead Inbox awaiting review.
3. `REJECTED`: Business previously rejected in Lead Inbox.
4. `SEEN_BEFORE`: Business seen in past searches (`seenCount > 1`).
5. `NEW`: Business discovered for the first time.

### 2.5 UI Components

- `SearchHistory` (`src/features/discovery/search-history.tsx`): Displays recent search sessions with time, result breakdown, and instant restore links (0 quota cost).
- `SearchForm` (`src/features/discovery/search-form.tsx`):
  - Two distinct submit actions: `[Tìm khách hàng]` (1 request) vs `[✨ Tìm thêm khách mới]` (auto-filter seen places, max 3 requests).
  - Stats banner displaying summary of new vs skipped businesses and request count.
  - Status badges and contextual action buttons per row.
- `DiscoverPage` (`src/app/discover/page.tsx`): Combines history bar and search form.

---

## 3. Verification

- `npm run typecheck`: PASS
- `npm run lint`: PASS (0 errors, 0 warnings)
- `npm test`: PASS (40 test files, 189 unit & integration tests)
- `npm run build`: PASS (Turbopack production build succeeds)
- `npx prisma migrate status`: PASS (Database schema is up to date)
