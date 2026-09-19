# SAOBEO LEAD — TASK E
## Priority Score v1 — Rank Leads by Who to Contact First

## CURRENT VERIFIED STATE

Source of truth:
- Repo: `saomailuong-maker/SAOBEO-LEAD`
- Branch: `main`
- Latest pushed commit:
  - `9885e5f feat: add deterministic opportunity engine`

Verified working:
- CRM Phase 1
- RapidAPI Text Search
- RapidAPI Place Details enrichment
- Lead Inbox
- CRM phone/website autofill
- Website Audit MVP
- Opportunity Engine v1
- Lead Detail already shows:
  - Website Audit
  - Opportunity list
  - "Lý do nên tiếp cận"

Current Opportunity Engine:
- NO_WEBSITE
- WEBSITE_SECURITY
- MOBILE_READINESS
- CONTACT_CONVERSION
- CLICK_TO_CALL
- SEO_FOUNDATION
- SOCIAL_SHARING
- DIRECT_BOOKING
- Deterministic
- No AI
- No persisted opportunity table
- No numeric score yet

Current Leads page:
- filters: name / industry / stage
- columns: business / industry / location / stage / follow-up
- ordered by `updatedAt desc`
- no priority score column/filter/sort yet

IMPORTANT:
`PROJECT_STATE.md` may still describe the latest task as local/not pushed.
Task E must correct that because Task D commit `9885e5f` is already pushed.

---

# 1. BUSINESS GOAL

Task D answers:

```text
What can Sao Béo offer this lead?
```

Task E must answer:

```text
Which lead should I contact first today?
```

The score must help prioritize sales effort.

It must NOT pretend to predict:
- who will buy
- conversion probability
- revenue probability

Use the wording:

```text
Điểm ưu tiên
```

not:

```text
Tỷ lệ chốt
```

---

# 2. PRINCIPLE

Priority Score v1 must be:

- deterministic
- explainable
- reproducible
- based only on known evidence
- easy to tune later

Every point awarded must have a visible reason.

No AI.

No hidden weighting.

No machine learning.

---

# 3. SCORE STRUCTURE

Use a total score:

```text
0–100
```

Recommended groups:

```text
A. Contactability       max 25
B. Opportunity strength max 50
C. Sales readiness      max 25
                        -------
TOTAL                   max 100
```

Do not exceed 100.

---

# 4. A — CONTACTABILITY (MAX 25)

The question:

```text
Can I actually reach this business?
```

Suggested rules:

```text
Phone exists               +12
Website exists             +5
Email exists               +5
Zalo / Facebook / Instagram
(any direct social URL)     +3
```

Cap:

```text
25
```

Important:
- phone from Place Details counts
- website counts even if audit later finds issues
- do NOT infer email/social if absent
- do not scrape new data in Task E

If no contact channel at all:

```text
0 contactability
```

---

# 5. B — OPPORTUNITY STRENGTH (MAX 50)

Use current `generateOpportunities()` result.

Recommended weights by opportunity TYPE, not only generic severity.

Suggested:

```text
NO_WEBSITE             +30
WEBSITE_SECURITY       +15
MOBILE_READINESS       +12
CONTACT_CONVERSION     +18
CLICK_TO_CALL          +8
SEO_FOUNDATION         +8
SOCIAL_SHARING         +3
DIRECT_BOOKING         +15
LOCAL_CONTACT          +15
CONTENT_STRUCTURE      +6
```

Important:
- if a type is not currently generated, do not invent it just to score
- score only generated opportunity types
- prevent double-counting overlapping contact opportunities

Cap this group at:

```text
50
```

Example:

```text
NO_WEBSITE 30
+
DIRECT_BOOKING 15
=
45
```

Another:

```text
CONTACT_CONVERSION 18
+
CLICK_TO_CALL 8
+
SEO_FOUNDATION 8
=
34
```

---

# 6. C — SALES READINESS (MAX 25)

Use CRM state and available sales workflow evidence.

Recommended v1:

```text
Stage QUALIFIED       +5
Stage CONTACTED       +8
Stage REPLIED         +15
Stage INTERESTED      +20
Stage AUDIT_SENT      +15
Stage DEMO_SENT       +20
Stage QUOTATION       +20
Stage NEGOTIATION     +25
```

For:

```text
WON
LOST
```

the lead should NOT appear as a normal "contact-first" priority.

Recommended handling:

```text
WON  => score category CLOSED
LOST => score category CLOSED
```

Do not rank them with active leads.

For stage:

```text
NEW
```

add:

```text
0
```

Task E v1 does NOT analyze message opens, report views, or customer engagement tracking because those do not exist yet.

---

# 7. SCORE RESULT TYPE

Create a focused result type:

```ts
type PriorityBand = "HOT" | "WARM" | "LOW" | "CLOSED";

type ScoreReason = {
  code: string;
  label: string;
  points: number;
  group: "CONTACTABILITY" | "OPPORTUNITY" | "READINESS";
};

type PriorityScoreResult = {
  total: number;
  band: PriorityBand;
  contactability: number;
  opportunity: number;
  readiness: number;
  reasons: ScoreReason[];
};
```

---

# 8. PRIORITY BANDS

Suggested:

```text
HOT     70–100
WARM    45–69
LOW      0–44
CLOSED  WON / LOST
```

These bands mean:

```text
HOT  = nên xem xét liên hệ sớm
WARM = có tiềm năng nhưng chưa ưu tiên cao
LOW  = dữ liệu/cơ hội hiện chưa đủ mạnh
```

Do NOT describe HOT as:

```text
"khả năng mua cao"
```

Do not imply conversion probability.

---

# 9. EXPLAINABILITY

For every score, show why.

Example:

```text
Điểm ưu tiên: 82 — HOT

Liên hệ: 17/25
+ Có số điện thoại       +12
+ Có website              +5

Cơ hội: 50/50
+ Chưa có CTA rõ ràng    +18
+ Chưa có click-to-call   +8
+ SEO cơ bản còn thiếu    +8
+ Chưa có booking        +15
(capped at 50)

Sẵn sàng bán hàng: 15/25
+ Đã phản hồi             +15
```

If capped, internal calculation may include raw total but displayed group score must show cap.

---

# 10. NO WEBSITE LEADS

A lead without website can still score high.

Example:

```text
Phone           +12
NO_WEBSITE      +30
Stage QUALIFIED  +5
--------------------
47 => WARM
```

If it also has social/email:

```text
score increases
```

This is expected.

Do NOT require Website Audit for scoring.

---

# 11. FAILED / MISSING AUDIT

If lead has website but:
- no WebsiteScan yet
- latest audit failed

then:
- Contactability still scores normally
- Opportunity score uses only current Opportunity Engine output
- do NOT invent missing audit opportunities
- show note:

```text
Điểm cơ hội có thể chưa đầy đủ vì chưa có Website Audit thành công.
```

---

# 12. CLOSED LEADS

For:

```text
WON
LOST
```

Return:

```text
band = CLOSED
```

Recommended:

```text
total = 0
```

or preserve computed data internally but UI must clearly exclude them from active ranking.

Simplest v1:

```text
total = 0
band = CLOSED
reasons = []
```

Do NOT include closed leads in "Ưu tiên hôm nay".

---

# 13. MODULE BOUNDARY

Create:

```text
src/features/priority-score/
```

Suggested:

```text
types.ts
weights.ts
score.ts
score.test.ts
```

Do NOT put scoring logic inside:
- Lead page
- Website Audit
- Opportunity Engine

Architecture:

```text
Lead + OpportunityResult
        ↓
Priority Score
```

Opportunity Engine remains the source of business opportunities.

---

# 14. NO DATABASE MIGRATION IN V1

Preferred:

```text
compute dynamically
```

Do not store score on Lead.

Reasons:
- rules will change
- stored score easily becomes stale
- current dataset is small

No migration unless strictly justified.

If Codex believes persistence is required, it must STOP and explain before modifying Prisma.

---

# 15. LEAD DETAIL UI

Add a compact block above or beside "Cơ hội đề xuất":

```text
Điểm ưu tiên

82 / 100
HOT
```

Show breakdown:

```text
Liên hệ          17/25
Cơ hội           50/50
Sẵn sàng         15/25
```

Expandable section:

```text
Vì sao có điểm này?
```

Then list score reasons.

Do not make Lead Detail much longer by default.

---

# 16. LEADS LIST UI — IMPORTANT

Update `/leads`.

Add columns:

```text
Ưu tiên
Cơ hội
```

Example:

```text
82 HOT
4 cơ hội
```

Allow sorting by Priority Score.

Because score is computed dynamically and current list max is 200 leads, v1 may:
1. fetch relevant lead + latest WebsiteScan;
2. compute OpportunityResult;
3. compute PriorityScoreResult;
4. sort in application memory.

Do NOT add DB score persistence just to sort.

Default ordering recommendation:

```text
priority desc
```

BUT only if it does not make existing CRM behavior confusing.

Safer UI:

Add query:

```text
sort=priority
```

and dropdown:

```text
Sắp xếp:
- Cập nhật gần nhất
- Ưu tiên cao nhất
```

Default may stay:

```text
Cập nhật gần nhất
```

to avoid silently changing existing behavior.

---

# 17. FILTER

Add optional:

```text
Mức ưu tiên
```

Values:

```text
Tất cả
HOT
WARM
LOW
```

Do not include CLOSED unless user explicitly filters closed through stage.

Filtering can happen after dynamic scoring in memory.

---

# 18. "ƯU TIÊN HÔM NAY" — SMALL DASHBOARD ENHANCEMENT

Only if implementation is simple:

On Dashboard, add:

```text
Ưu tiên hôm nay
```

Show top 5 active leads by score:

```text
82 HOT — Mây Homestay
76 HOT — ABC Villa
...
```

Each links to Lead Detail.

Do NOT redesign dashboard.

This section is OPTIONAL for Task E.

Core Done criteria:
- Lead Detail score
- Leads list score
- sorting/filtering

---

# 19. SCORE SAFETY / ANTI-GAMING

Do not award duplicate points for essentially the same evidence beyond defined weights.

Examples:

`CONTACT_CONVERSION` and `LOCAL_CONTACT` should not both score if engine already merges them.

Do not score:
- number of findings directly
- raw count of missing tags
- every audit warning equally

Use opportunity types.

---

# 20. TESTS

Minimum:

## Contactability
- phone => +12
- website => +5
- email => +5
- social => +3
- capped at 25

## Opportunity
- NO_WEBSITE => correct points
- combined opportunities => sum
- cap at 50
- no duplicate type counted twice

## Readiness
- NEW => 0
- QUALIFIED => 5
- REPLIED => 15
- INTERESTED => 20
- NEGOTIATION => 25

## Closed
- WON => CLOSED
- LOST => CLOSED

## Bands
- 70 => HOT
- 69 => WARM
- 45 => WARM
- 44 => LOW

## Explainability
- total equals sum of displayed group scores
- every non-zero awarded rule has a reason

## Missing audit
- lead with website but no successful scan does not get fake website issues

## Integration
- Lead Detail renders score
- Leads list can sort high-to-low by dynamic priority

---

# 21. MANUAL ACCEPTANCE — USER TEST REQUIRED

Codex must NOT mark Task E fully DONE until manual acceptance is performed.

This is a task where the user MUST inspect real results because score weights are business decisions.

Test at least 4 real/example leads:

### Case 1 — No website + phone
Expected:
- clear opportunity points
- likely WARM/HOT depending other data

### Case 2 — Website with several audit problems
Expected:
- opportunity points reflect actual Opportunity Engine output

### Case 3 — Strong contactability but few opportunities
Expected:
- should NOT become HOT merely because phone/email exist

### Case 4 — WON or LOST
Expected:
- CLOSED
- excluded from active priority ranking

User must answer:

```text
Do the top-ranked leads actually feel like the leads I would contact first?
```

If NO:
- adjust weights before Task E is finalized.

DO NOT tune weights only to make tests pass.

---

# 22. WHEN TO ASK USER TO TEST

Codex should stop AFTER:

```text
typecheck PASS
lint PASS
tests PASS
build PASS
```

and BEFORE final commit if business acceptance has not been verified.

Then report:

```text
Task E code is ready.
Manual business-ranking acceptance is required now.
Please test 4 lead cases and review the top-priority ordering.
```

Only after user confirms ranking makes sense:
- update PROJECT_STATE as DONE
- commit

If Codex already commits before manual test, do not push until user acceptance.

---

# 23. VERIFY

Required:

```bash
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

No migration expected.

---

# 24. GIT

Commit after manual business acceptance:

```text
feat: add lead priority scoring
```

Do not push until:
- automated verification passes
- manual score ranking is accepted by user

---

# 25. PROJECT_STATE

Correct Task D status:

```text
9885e5f feat: add deterministic opportunity engine
```

is already pushed.

Update:

```text
Task D: DONE / pushed
Task E: Priority Score <status>
```

If manual acceptance is pending:

```text
Task E:
code complete
manual business-ranking acceptance pending
```

Do not claim DONE until user verifies ranking.

---

# 26. STRICTLY OUT OF SCOPE

Do NOT add:

- AI
- OpenAI API
- conversion probability
- revenue probability
- engagement tracking
- public audit reports
- outreach drafting
- demo generator
- proposal generator
- automated messaging
- web crawling
- email enrichment
- score persistence
- background queues

---

# 27. NEXT TASK

Do not start.

After Task E is accepted:

```text
Task F — AI Personalized Outreach Draft
```

Task F will use:
- lead data
- top opportunities
- contact reasons
- priority score

to draft personalized outreach.

---

# 28. CODEX PROMPT

```text
Read PROJECT_STATE.md first.

Inspect current main-branch code for:
- Lead model
- Leads list page
- Lead Detail page
- Opportunity Engine types and generateOpportunities()
- Dashboard only if a small top-priority section is easy

Then read SAOBEO-LEAD-TASK-E-PRIORITY-SCORE.md completely.

GOAL
Implement an explainable deterministic 0–100 Priority Score that helps decide which active lead should be contacted first.

SCORE GROUPS
- Contactability max 25
- Opportunity strength max 50
- Sales readiness max 25

NO AI.
NO CONVERSION PROBABILITY.
NO DATABASE PERSISTENCE by default.

IMPLEMENT ONLY
1. Priority score types/weights/engine;
2. explainable score reasons;
3. HOT/WARM/LOW/CLOSED bands;
4. Lead Detail score UI;
5. Leads list priority column;
6. priority sort/filter;
7. focused tests;
8. optional small Dashboard top-5 section only if simple.

IMPORTANT
- use Opportunity Engine output as opportunity input;
- do not count raw audit findings directly;
- deduplicate opportunity types;
- closed WON/LOST leads must not rank as active leads;
- missing/failed audit must not create fake opportunity points;
- keep rules easy to tune.

BEFORE CODING
Return only:
1. files to inspect/change;
2. exact score weights;
3. band thresholds;
4. list sorting/filter design;
5. DB decision;
6. assumptions.

Then implement.

AUTOMATED VERIFY
- npm run typecheck
- npm run lint
- npm test
- npm run build
- git diff --check

IMPORTANT — MANUAL TEST GATE
After automated verification passes, STOP.

Do NOT declare Task E DONE yet.

Tell the user:
"Task E code is ready. Manual business-ranking acceptance is required now."

Ask the user to test:
1. no website + phone;
2. website with multiple audit opportunities;
3. strong contactability + weak opportunity;
4. WON/LOST lead.

The user must verify whether the highest-ranked leads are actually the ones they would contact first.

Only after user confirms the ranking makes business sense:
1. update PROJECT_STATE.md to Task E DONE;
2. commit:
   feat: add lead priority scoring

Do not start Task F.
```
