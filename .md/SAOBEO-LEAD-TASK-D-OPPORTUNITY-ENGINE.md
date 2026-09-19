# SAOBEO LEAD — TASK D
## Opportunity Engine v1 — Turn Audit Evidence Into Sales Opportunities

## CURRENT VERIFIED STATE

Source of truth:
- Repo: `saomailuong-maker/SAOBEO-LEAD`
- Branch: `main`
- Latest pushed commit:
  - `458a397 feat: add website audit MVP`

Verified working:
- CRM Phase 1
- RapidAPI Text Search
- RapidAPI Place Details enrichment
- Lead Inbox
- CRM phone/website autofill
- Website Audit MVP
- Website scans persist `checks` + `findings`
- Lead Detail displays Website Audit results
- Current deterministic audit findings include:
  - NO_HTTPS
  - MISSING_META_DESCRIPTION
  - MISSING_VIEWPORT
  - MISSING_CONTACT_CTA
  - MISSING_CLICK_TO_CALL
  - MISSING_CANONICAL
  - MISSING_OG_TITLE

Known Website Audit limitation:
- homepage HTML only
- no JS browser rendering
- no crawl of child pages

IMPORTANT:
PROJECT_STATE.md still says Task C commit is `local, not pushed`.
Task D must correct that because commit `458a397` is now pushed.

---

# 1. BUSINESS GOAL

Task C answers:

```text
What is wrong/missing?
```

Task D must answer:

```text
What business opportunity does this create,
and what can Sao Béo realistically offer?
```

Convert deterministic evidence into deterministic sales opportunities.

Example:

```text
Finding:
MISSING_CONTACT_CTA

Opportunity:
Improve lead conversion

Reason:
Website does not expose a clear contact action on the scanned homepage.

Suggested service:
CTA / contact conversion optimization
```

No AI in Task D.

---

# 2. CORE PRINCIPLE

Do NOT invent sales claims.

Every opportunity must be traceable to one or more concrete inputs:

```text
Lead data
+
Places enrichment
+
Latest Website Audit
```

An opportunity must expose its evidence.

Do NOT say:

```text
"Website is losing 50% of customers"
```

unless such data actually exists.

Prefer:

```text
"Không tìm thấy CTA liên hệ rõ ràng trong lần quét trang chủ."
```

---

# 3. INPUTS AVAILABLE

## Lead

Current Lead can provide:

```text
businessName
industry
locationText
websiteUrl
phone
email
facebookUrl
instagramUrl
zaloUrl
stage
```

## Discovered business / source context

Where available from original discovery:

```text
rating
reviewCount
businessStatus
Google Place ID
```

If not easily connected to the CRM Lead in current schema, use only fields already safely available on Lead in v1.

Do NOT redesign discovery schema just for Task D.

## Website Audit

Latest successful WebsiteScan:

```text
checks
findings
http status
HTTPS
contact/conversion signals
SEO signals
structure signals
```

---

# 4. OPPORTUNITY TYPES

Create a small fixed taxonomy.

Suggested:

```text
NO_WEBSITE
WEBSITE_SECURITY
MOBILE_READINESS
CONTACT_CONVERSION
CLICK_TO_CALL
LOCAL_CONTACT
SEO_FOUNDATION
SOCIAL_SHARING
CONTENT_STRUCTURE
DIRECT_BOOKING
```

Only add an opportunity when evidence supports it.

---

# 5. RULES V1

## Rule A — No Website

Condition:

```text
lead.websiteUrl is null/empty
```

Opportunity:

```text
type: NO_WEBSITE
severity: HIGH
title: Chưa có website riêng
reason: Lead hiện chưa có website được lưu trong CRM.
service: Website doanh nghiệp / landing page
```

Do NOT auto-create a fake WebsiteScan.

---

## Rule B — No HTTPS

Finding:

```text
NO_HTTPS
```

Opportunity:

```text
type: WEBSITE_SECURITY
severity: HIGH
title: Website chưa dùng HTTPS
service: HTTPS / technical website remediation
```

---

## Rule C — Mobile readiness

Finding:

```text
MISSING_VIEWPORT
```

Opportunity:

```text
type: MOBILE_READINESS
severity: HIGH or MEDIUM
title: Chưa tìm thấy cấu hình viewport mobile
service: Mobile optimization / responsive website
```

Use MEDIUM unless there is stronger evidence.

---

## Rule D — Missing CTA

Finding:

```text
MISSING_CONTACT_CTA
```

Opportunity:

```text
type: CONTACT_CONVERSION
severity: HIGH
title: Thiếu CTA liên hệ rõ ràng
service: Conversion-focused CTA / contact flow
```

---

## Rule E — No click-to-call

Finding:

```text
MISSING_CLICK_TO_CALL
```

Opportunity:

```text
type: CLICK_TO_CALL
severity: MEDIUM
title: Chưa có click-to-call rõ ràng
service: Phone / Zalo / contact optimization
```

If Lead already has a phone from Places, include that as supporting context:

```text
CRM đã có số điện thoại nhưng website chưa phát hiện liên kết gọi trực tiếp.
```

Do not expose phone itself in rule text unless useful.

---

## Rule F — SEO foundation

Any of:

```text
MISSING_META_DESCRIPTION
MISSING_CANONICAL
```

Create ONE combined opportunity, not duplicates:

```text
type: SEO_FOUNDATION
severity: MEDIUM
title: SEO cơ bản còn thiếu
service: On-page SEO foundation
```

Evidence should list all matched findings.

---

## Rule G — Social sharing

Finding:

```text
MISSING_OG_TITLE
```

Opportunity:

```text
type: SOCIAL_SHARING
severity: LOW
title: Metadata chia sẻ mạng xã hội chưa đầy đủ
service: Open Graph / social metadata optimization
```

---

## Rule H — Contact channels

From `checks.contact`:

If no:
- tel link
- mailto link
- form
- Zalo
- Messenger
- WhatsApp

then:

```text
type: LOCAL_CONTACT
severity: HIGH
title: Ít tín hiệu liên hệ trực tiếp trên trang chủ
service: Contact conversion setup
```

Avoid duplicate opportunity if `CONTACT_CONVERSION` already fully covers the same evidence.

Either merge them or choose the stronger opportunity.

---

## Rule I — Booking for accommodation

Only if:

```text
lead.industry indicates Homestay / Hotel / Villa / Resort / lodging
```

AND:

```text
checks.structure.booking == false
```

Opportunity:

```text
type: DIRECT_BOOKING
severity: MEDIUM
title: Chưa tìm thấy tín hiệu đặt phòng trực tiếp
service: Direct booking landing flow
```

Wording MUST be:

```text
Không tìm thấy trong trang chủ được quét.
```

Not:

```text
Website không có booking.
```

---

# 6. RESULT TYPE

Use a deterministic type such as:

```ts
type OpportunitySeverity = "HIGH" | "MEDIUM" | "LOW";

type LeadOpportunity = {
  type: string;
  severity: OpportunitySeverity;
  title: string;
  reason: string;
  suggestedService: string;
  evidenceCodes: string[];
  evidence: string[];
};
```

Opportunities are generated from current state.

Task D v1 does NOT need permanent Opportunity database records unless the existing architecture clearly benefits from it.

Preferred v1:
- compute from Lead + latest scan at request/render time
- deterministic
- no stale opportunity table

Persisting can come later if needed for scoring/history.

---

# 7. DEDUPLICATION / MERGING

Do not flood UI with near-duplicate opportunities.

Examples:

```text
MISSING_CONTACT_CTA
+
no tel
+
no forms
```

should result in at most 1–2 useful conversion opportunities.

SEO:

```text
MISSING_META_DESCRIPTION
+
MISSING_CANONICAL
```

should combine into one `SEO_FOUNDATION`.

Aim:

```text
3–6 opportunities per lead
```

not 15 technical warnings.

---

# 8. SORT ORDER

Sort:

```text
HIGH
MEDIUM
LOW
```

Within same severity, stable order from rule definition.

No numeric score yet.

Task E will add Priority Score.

---

# 9. UI

On Lead Detail, BELOW Website Audit, add compact section:

```text
Cơ hội đề xuất
```

For each opportunity show:

```text
[HIGH]
Thiếu CTA liên hệ rõ ràng

Vì sao:
Không tìm thấy CTA liên hệ rõ ràng trong lần quét trang chủ.

Gợi ý dịch vụ:
Tối ưu CTA / luồng liên hệ

Bằng chứng:
MISSING_CONTACT_CTA
```

Use readable Vietnamese.

Do not expose raw JSON.

If no website:

```text
HIGH
Chưa có website riêng

Gợi ý:
Website doanh nghiệp / landing page
```

If no opportunities:

```text
Chưa phát hiện cơ hội rõ ràng từ dữ liệu hiện tại.
```

Do NOT redesign entire Lead Detail page.

---

# 10. "WHY CONTACT THIS LEAD?" SUMMARY

Add one deterministic compact summary:

```text
Lý do nên tiếp cận
```

Generated from top 1–3 opportunities only.

Example:

```text
- Chưa tìm thấy CTA liên hệ rõ ràng
- CRM có số điện thoại nhưng website chưa có click-to-call
- SEO cơ bản còn thiếu
```

No AI prose.

This becomes the input for Task F AI outreach later.

---

# 11. NO WEBSITE FLOW

A lead without website must still produce Opportunity Engine output.

Example:

```text
HIGH — Chưa có website riêng
```

Do not show:

```text
Website Audit required
```

Opportunity Engine should work with partial data.

---

# 12. FAILED AUDIT FLOW

If latest audit failed:

- do NOT convert the audit error into technical opportunities
- still allow non-audit rules such as `NO_WEBSITE` if applicable
- show a small note:

```text
Audit gần nhất chưa thành công; cơ hội hiện tại chỉ dựa trên dữ liệu CRM có sẵn.
```

---

# 13. MODULE

Suggested:

```text
src/features/opportunities/
```

Files:

```text
types.ts
rules.ts
engine.ts
engine.test.ts
```

Keep it separate from Website Audit.

Website Audit produces evidence.
Opportunity Engine interprets evidence.

Do not put sales rules into `website-audit/findings.ts`.

---

# 14. TESTS

Minimum tests:

## No website
- lead without website => NO_WEBSITE HIGH

## Conversion
- MISSING_CONTACT_CTA => CONTACT_CONVERSION
- no CTA + no tel/form should not create excessive duplicates

## Phone context
- CRM phone exists + no tel link => CLICK_TO_CALL with relevant reason

## SEO merge
- description + canonical missing => one SEO_FOUNDATION opportunity

## Booking
- Homestay + no booking signal => DIRECT_BOOKING
- non-accommodation lead + no booking => no DIRECT_BOOKING

## Security
- NO_HTTPS => WEBSITE_SECURITY HIGH

## Ordering
- HIGH before MEDIUM before LOW

## Failed audit
- audit failure does not produce fake website problems

## Evidence
- every generated opportunity has at least one evidence source/code

---

# 15. NO DATABASE MIGRATION BY DEFAULT

Task D should preferably NOT create a migration.

Compute opportunities dynamically from:

```text
Lead
+
latest WebsiteScan
```

Only add DB changes if strictly required and explain why before coding.

---

# 16. STRICTLY OUT OF SCOPE

DO NOT add:

- numeric lead score
- AI
- OpenAI API
- AI outreach
- public audit page
- report view tracking
- demo generator
- screenshot
- proposal
- automated messaging
- email scraping
- page crawling
- Redis/queues
- analytics dashboard

---

# 17. VERIFY

Required:

```bash
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

No migration expected unless justified.

Manual acceptance:

Test at least:
1. lead WITH website + Website Audit findings;
2. lead WITHOUT website.

Confirm opportunity output makes business sense and no duplicates overwhelm the UI.

---

# 18. GIT

Commit:

```text
feat: add deterministic opportunity engine
```

Do not push until manual acceptance passes.

---

# 19. PROJECT_STATE

Correct stale Task C push status:

```text
458a397 feat: add website audit MVP
```

is pushed.

Update:

```text
Task C: DONE / pushed / live verified
Task D: Opportunity Engine <status>
```

---

# 20. NEXT TASK

Do NOT start it.

After Task D:

```text
Task E — Priority Score
```

Task E will combine:
- fit
- opportunity strength
- contactability
- later engagement

into a numeric priority for deciding whom to contact first.

---

# 21. CODEX PROMPT

```text
Read PROJECT_STATE.md first.

Inspect current main-branch code for:
- Lead model
- WebsiteScan model
- Lead Detail page
- website-audit/types.ts
- website-audit/findings.ts

Then read SAOBEO-LEAD-TASK-D-OPPORTUNITY-ENGINE.md completely.

GOAL
Build a deterministic Opportunity Engine that converts Lead data + latest Website Audit evidence into a small set of actionable sales opportunities.

IMPORTANT ARCHITECTURE
Website Audit = technical evidence.
Opportunity Engine = business interpretation.
Keep these modules separate.

IMPLEMENT ONLY
1. opportunity types;
2. deterministic rules;
3. merging/deduplication;
4. severity sorting;
5. "Cơ hội đề xuất" section on Lead Detail;
6. deterministic "Lý do nên tiếp cận" summary;
7. focused tests.

NO AI.
NO NUMERIC SCORE.
NO PUBLIC REPORT.
NO DEMO.
NO OUTREACH AUTOMATION.
NO DATABASE MIGRATION unless strictly required.

RULE SAFETY
- every opportunity must have evidence;
- do not invent performance/revenue claims;
- use "không tìm thấy trong lần quét" when scan scope is limited;
- no duplicate spammy opportunities.

BEFORE CODING
Return only:
1. files to inspect/change;
2. rule taxonomy;
3. merging strategy;
4. database decision;
5. assumptions.

Then implement.

VERIFY
- npm run typecheck
- npm run lint
- npm test
- npm run build
- git diff --check

MANUAL ACCEPTANCE
- one lead with successful audit;
- one lead without website;
- verify output is concise, evidence-based and useful for sales.

AFTER CODING
1. Correct stale Task C push status in PROJECT_STATE.md.
2. Update Task D state.
3. Report verification results.
4. Commit:
   feat: add deterministic opportunity engine

Do not start Task E.
```
