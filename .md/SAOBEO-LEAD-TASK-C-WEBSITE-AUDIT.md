# SAOBEO LEAD — TASK C
## Website Audit MVP v1 — Detect Problems Before Outreach

## CURRENT VERIFIED STATE

GitHub source of truth:
- Repo: `saomailuong-maker/SAOBEO-LEAD`
- Main branch contains:
  - CRM Phase 1
  - RapidAPI Text Search
  - RapidAPI Place Details enrichment
  - Lead Inbox
  - CRM autofill for phone + website
- Latest verified commit:
  - `f6980d5 feat: enrich Lead Inbox with RapidAPI Place Details`
- Current `Lead` model already has:
  - businessName
  - industry
  - locationText
  - websiteUrl
  - phone
  - email
  - facebookUrl
  - instagramUrl
  - zaloUrl
  - pipeline/activity/task data
- Current Lead Detail page has:
  - Information
  - Activities
  - Pipeline
  - Follow-up
- No Website Audit exists yet.
- Current project has no HTML parser dependency.

IMPORTANT:
`PROJECT_STATE.md` still says latest commit is local/not pushed even though B3 is already pushed. Correct that during this task.

---

# 1. BUSINESS GOAL

Move SAOBEO LEAD from:

```text
Find business
→ enrich contact info
```

to:

```text
Find business
→ detect concrete website problems
→ create evidence for outreach
```

This task must answer:

```text
"What is visibly wrong or missing on this lead's website,
and what evidence can I use when contacting them?"
```

No AI in this task.

---

# 2. USER FLOW

From CRM Lead Detail:

```text
Leads
↓
Open Lead
↓
Website Audit
↓
[ Phân tích website ]
↓
Server scans homepage
↓
Audit findings appear
↓
Refresh
↓
Latest audit remains visible
```

If `lead.websiteUrl` is empty:

```text
Chưa có website để phân tích.
```

Do NOT try to guess/find a website in Task C.

---

# 3. WHAT TO AUDIT

## A. Reachability / HTTP

Collect:

```text
requested URL
final URL
HTTP status
redirect count
HTTPS yes/no
response duration
content type
```

UI wording:

```text
Thời gian phản hồi máy chủ
```

Do NOT call this PageSpeed.

---

## B. Basic SEO / technical HTML

Check:

```text
<title>
meta description
meta viewport
canonical
<html lang>
H1 count
Open Graph title
Open Graph description
favicon
robots meta
```

Store concise extracted values only.

Do NOT store full HTML.

---

## C. Contact & conversion signals

Detect:

```text
tel: links
mailto: links
forms
Zalo links
Messenger / m.me
WhatsApp links
Facebook links
Instagram links
```

Detect simple CTA text candidates:

```text
liên hệ
gọi ngay
zalo
đặt phòng
đặt bàn
đặt lịch
nhận báo giá
tư vấn
mua ngay
đăng ký
xem phòng
book now
contact
call
```

No AI classification.

---

## D. Common business-site structure

From links present on the scanned homepage, infer signals for:

```text
Giới thiệu / About
Dịch vụ / Services
Sản phẩm / Products
Liên hệ / Contact
Tin tức / Blog
FAQ
Portfolio / Dự án
Booking / Đặt phòng
```

Use wording:

```text
Có dấu hiệu tìm thấy
Không tìm thấy trong trang hiện tại
```

Do NOT claim the whole website lacks a page unless the scan actually verified it.

---

# 4. DETERMINISTIC FINDINGS

Generate structured findings from evidence.

Example:

```text
HIGH
Website không dùng HTTPS

MEDIUM
Không tìm thấy meta description trong lần quét này

MEDIUM
Không tìm thấy viewport mobile

MEDIUM
Không tìm thấy CTA liên hệ rõ ràng

MEDIUM
Không tìm thấy số điện thoại click-to-call

LOW
Không tìm thấy canonical

LOW
Không tìm thấy Open Graph title
```

Each finding should have:

```ts
severity: "HIGH" | "MEDIUM" | "LOW"
code: string
title: string
evidence?: string
```

Do NOT generate sales recommendations yet.

Task D will convert findings into opportunities.

---

# 5. DATABASE

Add minimal audit persistence.

Recommended enum:

```text
WebsiteScanStatus:
PENDING
SUCCESS
FAILED
```

Recommended model:

```prisma
model WebsiteScan {
  id           String @id @default(uuid()) @db.Uuid
  workspaceId  String @db.Uuid
  leadId       String @db.Uuid

  requestedUrl String
  finalUrl     String?
  status       WebsiteScanStatus
  httpStatus   Int?
  durationMs   Int?
  redirectCount Int?

  checks       Json?
  findings     Json?

  errorCode    String?
  startedAt    DateTime @default(now())
  finishedAt   DateTime?
  createdAt    DateTime @default(now())

  workspace Workspace @relation(...)
  lead      Lead      @relation(...)

  @@index([leadId, createdAt])
}
```

Add:

```text
Workspace.websiteScans
Lead.websiteScans
```

Keep history.

Do NOT add:
- scores
- evidence tables
- opportunities
- AI outputs

Those belong to later tasks.

---

# 6. MODULE BOUNDARY

Create a focused feature module such as:

```text
src/features/website-audit/
```

Suggested files:

```text
audit.ts
fetch.ts
security.ts
parser.ts
findings.ts
types.ts
actions.ts
*.test.ts
```

Exact naming may follow project conventions.

Keep network/security/parsing logic out of the React page.

---

# 7. HTML PARSING DEPENDENCY

Current repo has no HTML parser.

Prefer one small maintained parser dependency only if necessary.

Good implementation options:
- `cheerio`
- another small maintained server-side HTML parser

Do NOT introduce:
- Playwright
- Puppeteer
- browser automation
- jsdom unless clearly necessary

Task C scans server-rendered HTML only.

If a site is JS-only and returns almost no useful HTML, show that as a limitation instead of adding a browser engine.

---

# 8. SSRF SECURITY — NON-NEGOTIABLE

The app will fetch a lead-supplied URL.

Implement SSRF protection.

Allow only:

```text
http:
https:
```

Reject at least:

```text
localhost
*.localhost
127.0.0.0/8
0.0.0.0/8
10.0.0.0/8
100.64.0.0/10
169.254.0.0/16
172.16.0.0/12
192.168.0.0/16
224.0.0.0/4
::1
fc00::/7
fe80::/10
```

Also reject:
- credentials embedded in URL
- unsupported protocols
- malformed hosts

Required behavior:

1. Parse URL.
2. Validate protocol.
3. Resolve DNS before request.
4. Reject if ANY resolved target is private/reserved.
5. Fetch with redirect handling controlled manually.
6. Validate each redirect target again.
7. Maximum redirects: 5.
8. Timeout: about 10 seconds.
9. Maximum response body: about 2 MB.
10. Only analyze HTML/XHTML.
11. Do not forward cookies/auth headers.
12. Never expose stack traces to normal UI.

Tests must cover redirect-to-private-IP.

---

# 9. FETCH BEHAVIOR

Use a clear User-Agent:

```text
SAOBEO-LEAD WebsiteAudit/1.0
```

Do not crawl the whole site.

Task C scans only the submitted homepage/current website URL.

Do NOT recursively follow page links.

Optional:
- `/robots.txt`
- `/sitemap.xml`

Only add those if they stay trivial.
They are not required for Done.

---

# 10. ERROR CODES

Use stable internal codes:

```text
INVALID_URL
UNSAFE_TARGET
DNS_ERROR
TIMEOUT
TOO_MANY_REDIRECTS
HTTP_ERROR
NON_HTML
RESPONSE_TOO_LARGE
FETCH_FAILED
PARSE_FAILED
```

User messages in Vietnamese:

```text
URL website không hợp lệ.
Website không phản hồi trong thời gian cho phép.
Không thể phân tích nội dung trang này.
Địa chỉ website không được phép quét.
Website trả về nội dung không phải HTML.
```

Log technical context server-side.

Do not log secrets.

---

# 11. LEAD DETAIL UI

Do not redesign the whole page.

Add one compact section in the existing Lead Detail page:

```text
Website Audit
```

Show:

```text
Website
Lần quét gần nhất
Trạng thái
HTTP status
HTTPS
Thời gian phản hồi
```

Button:

```text
Phân tích website
```

Results grouped:

```text
Tổng quan
SEO cơ bản
Liên hệ & chuyển đổi
Cấu trúc nội dung
Vấn đề cần chú ý
```

Important:
The current Lead Detail page is already dense.
Keep audit section collapsible/compact if useful.
Do not make unrelated layout changes.

---

# 12. NO WEBSITE CASE

If no `websiteUrl`:

```text
Chưa có website để phân tích.
```

This itself may later become a strong opportunity signal, but Task C must NOT implement scoring/opportunity logic yet.

---

# 13. ACTIVITY LOG

After a successful or failed manual audit, optionally add one CRM Activity only if it is simple and consistent with existing actions.

Suggested successful summary:

```text
Đã phân tích website
```

Do NOT add a new ActivityType enum unless needed.

A NOTE is sufficient.

This is optional; do not complicate Task C for it.

---

# 14. TESTS

No real external websites in automated tests.

Mock DNS and fetch/network.

Minimum tests:

## Security
- accepts normal public HTTPS
- rejects localhost
- rejects 127.0.0.1
- rejects 10.x
- rejects 172.16-31.x
- rejects 192.168.x
- rejects link-local
- rejects unsafe protocols
- rejects URL with embedded credentials
- rejects redirect to private IP

## Parser
- title
- description
- viewport
- canonical
- H1 count
- lang
- Open Graph
- tel/mailto
- form
- Zalo/Messenger/social link detection
- CTA detection
- common section-link signals

## Findings
- HTTP no HTTPS => HIGH
- missing description
- missing viewport
- missing contact CTA
- missing phone
- canonical finding

## Persistence / action
- success saved
- failure saved with controlled error code
- scan must belong to current workspace lead

---

# 15. MANUAL ACCEPTANCE

Use an existing CRM lead with a real public website.

Flow:

```text
1. Open CRM Lead
2. Confirm website field contains real public website
3. Click Phân tích website
4. Audit completes
5. Findings displayed
6. Refresh page
7. Findings remain
```

Then security test:

Try an unsafe URL using a temporary/manual test lead or test action:

```text
http://127.0.0.1
```

Expected:

```text
Địa chỉ website không được phép quét.
```

No request should be made to local/private target.

---

# 16. VERIFY

Required:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx prisma migrate status
git diff --check
```

---

# 17. GIT

Commit:

```text
feat: add website audit MVP
```

Do NOT commit:
- `.env`
- API keys
- `.next`
- `node_modules`

Do not push until manual acceptance passes.

---

# 18. PROJECT_STATE

Correct the stale Git status.

It currently says latest B3 commit is local/not pushed.
B3 is now already pushed to GitHub.

Update state to:

```text
Task B3:
DONE
RapidAPI Text Search: live verified
RapidAPI Place Details: live verified
Lead Inbox enrichment: verified
CRM phone/website autofill: verified

Task C:
Website Audit MVP
<status>
```

Keep it concise.

---

# 19. STRICTLY OUT OF SCOPE

DO NOT implement in Task C:

- Opportunity Engine
- lead scoring
- AI
- AI sales messages
- public audit report
- tracking pixels / report view tracking
- demo generator
- screenshot
- PageSpeed / Lighthouse
- Wappalyzer / BuiltWith
- crawling multiple pages
- email enrichment
- automated outreach
- proposal generator
- queues / Redis

These come after we prove the audit data is reliable.

---

# 20. NEXT ROADMAP AFTER TASK C

Do not implement these now.

Planned order:

```text
Task C  Website Audit
↓
Task D  Opportunity Rules
↓
Task E  Priority Score
↓
Task F  AI Personalized Outreach Draft
↓
Task G  Public Audit Report + View Tracking
↓
Task H  Demo Generator
↓
Task I  Proposal Generator
↓
Task J  Follow-up Automation
```

---

# 21. CODEX PROMPT

```text
Read PROJECT_STATE.md first.
Then inspect the current main-branch implementation relevant to:
- Prisma Lead/Workspace models
- Lead Detail page
- CRM server actions
- existing test conventions

Then read SAOBEO-LEAD-TASK-C-WEBSITE-AUDIT.md completely.

GOAL
Implement Website Audit MVP v1 so an existing CRM Lead with a website can be safely scanned and produce deterministic evidence before outreach.

CURRENT VERIFIED STATE
- B3 commit f6980d5 is already pushed to GitHub.
- RapidAPI Text Search live PASS.
- RapidAPI Place Details live PASS.
- Lead Inbox enrichment live PASS.
- CRM phone/website autofill live PASS.
- No Website Audit currently exists.

IMPLEMENT ONLY
1. WebsiteScan persistence.
2. Safe server-side URL fetch with SSRF protection.
3. Homepage HTML parsing.
4. Basic HTTP / SEO / contact / conversion / structure checks.
5. Deterministic findings.
6. Compact Website Audit section on existing Lead Detail.
7. Focused automated tests.

SECURITY IS REQUIRED
- http/https only
- DNS resolve before fetch
- reject private/reserved IPs
- validate EVERY redirect
- max 5 redirects
- ~10 second timeout
- ~2 MB response limit
- HTML only
- no cookies/auth forwarding
- no internal stack trace in UI

DO NOT
- add AI
- add scoring
- add Opportunity Engine
- add PageSpeed/Lighthouse
- add Playwright/Puppeteer
- add screenshots
- add Wappalyzer/BuiltWith
- crawl the site recursively
- add email enrichment
- add public audit links
- add outreach automation
- refactor unrelated CRM/discovery code

BEFORE CODING
Return only:
1. files to inspect/change;
2. Prisma migration/model plan;
3. parser dependency decision;
4. SSRF design;
5. scan result schema;
6. assumptions.

Then implement.

VERIFY
- npm run typecheck
- npm run lint
- npm test
- npm run build
- npx prisma migrate status
- git diff --check

MANUAL ACCEPTANCE
- scan at least one real public lead website;
- persist and redisplay result after refresh;
- verify a localhost/private target is rejected.

AFTER CODING
1. Correct stale B3 push status in PROJECT_STATE.md.
2. Update Task C status.
3. Report exact verification results.
4. Report known limitations.
5. Commit:
   feat: add website audit MVP

Do not start Task D.
```
