# SAOBEO LEAD — Product & Technical Specification
**Version:** 1.0  
**Date:** 2026-09-17  
**Owner:** Sao Béo  
**Primary market:** Đức Trọng – Đà Lạt – Lâm Đồng  
**Initial use case:** Internal B2B prospecting + website sales CRM  
**Codename:** SAOBEO LEAD

---

## 0. Executive Summary

SAOBEO LEAD là một hệ thống tìm kiếm, phân tích và quản lý khách hàng tiềm năng dành cho agency/web freelancer địa phương.

Mục tiêu của hệ thống không phải chỉ là “cào danh sách doanh nghiệp”, mà là trả lời 5 câu hỏi:

1. Doanh nghiệp nào đáng tiếp cận?
2. Họ đang thiếu gì trong hiện diện số?
3. Dịch vụ nào phù hợp để chào bán?
4. Nên tiếp cận họ bằng thông điệp nào?
5. Sau khi tiếp cận thì cần follow-up khi nào và ở trạng thái nào?

Luồng giá trị cốt lõi:

```text
DISCOVER
   ↓
QUALIFY
   ↓
ENRICH
   ↓
AUDIT
   ↓
SCORE
   ↓
RECOMMEND
   ↓
OUTREACH
   ↓
CRM
   ↓
FOLLOW-UP
   ↓
DEMO / PROPOSAL
   ↓
WON / LOST
```

### North Star Metric

Không tối ưu theo “số lead thu thập”.

Tối ưu theo:

```text
Qualified Opportunities / tuần
```

và sau khi có đủ dữ liệu:

```text
Won Revenue / 100 Qualified Leads
```

---

# 1. Product Principles

## 1.1. Local-first

MVP tối ưu cho:

- Đức Trọng
- Đà Lạt
- Lâm Hà
- Đơn Dương
- Di Linh
- Lạc Dương
- Bảo Lộc

Không xây hệ thống quá tổng quát ngay từ đầu.

## 1.2. Opportunity-first

Một lead chỉ có số điện thoại không có nhiều giá trị.

SAOBEO LEAD phải phát hiện được:

```text
Khách này đang thiếu gì?
↓
Vì sao thiếu đó tạo ra cơ hội?
↓
Sao Béo có thể bán dịch vụ nào?
↓
Ước lượng mức độ phù hợp.
```

## 1.3. Human-in-the-loop

MVP không tự gửi spam hàng loạt.

AI được phép:

- nghiên cứu;
- phân tích;
- soạn lời chào;
- đề xuất hành động;
- tạo audit;
- tạo draft proposal.

Người dùng phải xác nhận trước khi gửi.

## 1.4. Progressive enrichment

Không gọi tất cả API cho mọi lead.

Luồng:

```text
Cheap Discovery
↓
Filter
↓
Qualified?
↓ YES
Deeper Enrichment
↓
Website Audit
↓
AI Analysis
```

Mục tiêu: giảm API cost và giảm dữ liệu thừa.

## 1.5. Source-aware data

Mỗi dữ liệu quan trọng cần biết nguồn:

```text
value
source
source_url / provider
fetched_at
confidence
verified_by_user
```

Không coi AI inference là fact.

---

# 2. Research-backed Product Decisions

## 2.1. Google Places chỉ là discovery layer

Google Places API yêu cầu FieldMask và các trường dữ liệu thuộc các SKU khác nhau.

Do đó:

- discovery request chỉ lấy trường tối thiểu;
- chỉ enrichment sâu với lead được chọn;
- không gọi field đắt tiền nếu chưa cần;
- API keys chỉ chạy server-side;
- ghi lại số request và estimated usage.

### Quy tắc lưu dữ liệu Google

Không thiết kế database như một bản sao Google Maps.

Tách:

```text
Google-derived transient data
```

khỏi:

```text
CRM-owned / user-entered / independently verified data
```

`place_id` có thể lưu để tham chiếu và nên có cơ chế refresh định kỳ.

UI hiển thị dữ liệu Google phải có attribution phù hợp khi áp dụng.

---

## 2.2. Waterfall enrichment

Áp dụng pattern giống các hệ thống enrichment hiện đại:

```text
Provider 1
↓ không có
Provider 2
↓ không có
Provider 3
↓
Found
→ STOP
```

Không gọi 4 dịch vụ cùng lúc.

Ví dụ tìm social/contact:

```text
Website crawl
→ public contact page
→ optional enrichment provider
→ manual verify
```

Mỗi enrichment phải có:

```text
cost_estimate
provider
confidence
status
```

---

## 2.3. Scoring không dùng một điểm duy nhất

SAOBEO LEAD sử dụng:

### Fit Score
Doanh nghiệp có đúng nhóm khách Sao Béo muốn bán không?

### Opportunity Score
Hiện trạng digital có tạo ra cơ hội bán hàng không?

### Engagement Score
Sau khi liên hệ, khách có tín hiệu quan tâm không?

### Priority Score

```text
Priority =
  Fit * 0.35
+ Opportunity * 0.45
+ Engagement * 0.20
```

Ở giai đoạn chưa outreach:

```text
Priority =
  Fit * 0.45
+ Opportunity * 0.55
```

Không để AI tự tạo điểm tùy ý.

AI chỉ giải thích score và bổ sung tín hiệu có confidence.

---

# 3. Personas

## 3.1. Primary

**Sao Béo / Sales Owner**

Nhu cầu:

- tìm lead nhanh;
- biết lead nào đáng gọi;
- xem vấn đề website;
- tạo lời chào;
- quản lý follow-up;
- tạo audit/demo;
- xem pipeline.

## 3.2. Secondary — Phase 2

Sales collaborator.

Quyền:

- xem assigned leads;
- thêm activity;
- follow-up;
- tạo draft outreach;
- không xem API keys;
- không thay scoring global.

## 3.3. Admin — Phase 3

Quản lý:

- users;
- API usage;
- providers;
- scoring;
- billing;
- workspace.

---

# 4. Industry Packs

Mỗi ngành có rule riêng.

MVP:

1. Homestay
2. Hotel
3. Cafe
4. Restaurant
5. Tour / Travel
6. Farm / Agriculture
7. Agricultural Store
8. Construction
9. Interior Design
10. Spa / Beauty
11. Dental / Clinic
12. Real Estate
13. Retail / Showroom

Mỗi Industry Pack chứa:

```text
search_queries[]
fit_rules[]
audit_rules[]
conversion_features[]
recommended_services[]
message_templates[]
demo_template_id
```

Ví dụ `homestay`:

```yaml
search_queries:
  - "homestay {location}"
  - "villa {location}"
  - "bungalow {location}"

conversion_features:
  - booking
  - phone
  - zalo
  - messenger
  - map
  - room_gallery
  - pricing
  - reviews
  - faq

recommended_services:
  - website
  - booking
  - local_seo
  - google_business_optimization
```

---

# 5. Main Navigation

```text
SAOBEO LEAD

Dashboard
Find Leads
Lead Inbox
Opportunities
CRM
Tasks
Audits
AI Assistant
Reports

Settings
 ├─ Workspace
 ├─ Locations
 ├─ Industries
 ├─ Scoring
 ├─ Integrations
 ├─ AI
 ├─ Data & Privacy
 └─ API Usage
```

---

# 6. Dashboard

## KPI cards

```text
New Leads
Qualified Leads
Hot Opportunities
Follow-ups Today
Proposal Open
Won This Month
Pipeline Value
```

## Widgets

### Today's Tasks

```text
09:00 Follow-up Mây Homestay
10:30 Send audit Hotel A
14:00 Call Farm B
```

### Hot Opportunities

Columns:

```text
Business
Industry
Location
Priority
Main Gap
Suggested Offer
Next Action
```

### Pipeline

```text
NEW
CONTACTED
INTERESTED
AUDIT SENT
DEMO SENT
QUOTATION
NEGOTIATION
WON
LOST
```

### Source Performance

```text
Google Places
Manual
Referral
Facebook
Imported CSV
Website form
```

---

# 7. Find Leads

Route:

```text
/leads/discover
```

## Search form

Fields:

```text
Location
Radius
Industry
Keyword
Business status
Website status
Minimum rating
Minimum review count
Max results
```

Advanced:

```text
Has website
No website
Unknown

Has phone
Has social
Has public email
```

Buttons:

```text
Preview Search
Search
Save Search
```

## Default saved searches

```text
Homestay Đà Lạt — No Website
Hotel Đà Lạt — Weak Website
Farm Đức Trọng
Construction Đức Trọng
Cafe Đà Lạt
Spa Đà Lạt
```

---

# 8. Discovery Engine

Interface:

```ts
interface DiscoveryProvider {
  search(input: DiscoveryQuery): Promise<DiscoveryResult[]>
}
```

First provider:

```text
GooglePlacesProvider
```

Future:

```text
ManualCSVProvider
PublicDirectoryProvider
UserDefinedProvider
```

Normalize response:

```ts
type DiscoveredBusiness = {
  provider: string
  externalId: string
  name: string
  category?: string
  locationText?: string
  latitude?: number
  longitude?: number
  websiteCandidate?: string
  phoneCandidate?: string
  ratingCandidate?: number
  reviewCountCandidate?: number
  rawExpiresAt?: Date
}
```

**IMPORTANT**

Google-derived values must retain provenance and policy-aware handling.

---

# 9. Lead Inbox

Search results do not immediately become CRM leads.

They first enter:

```text
Lead Inbox
```

Statuses:

```text
UNREVIEWED
QUALIFIED
REJECTED
DUPLICATE
CRM_CREATED
```

Actions:

```text
Quick qualify
Analyze website
Create lead
Reject
Merge duplicate
```

Bulk actions:

```text
Analyze selected
Qualify selected
Create CRM records
```

Do not allow:

```text
Bulk auto-send outreach
```

in MVP.

---

# 10. Deduplication

Deduplicate by strongest match first:

```text
external provider id
↓
normalized domain
↓
normalized phone
↓
name + locality similarity
```

Database:

```text
lead_identity_keys
```

Fields:

```text
lead_id
type
normalized_value
confidence
```

Examples:

```text
place_id
domain
phone
business_name_location
```

---

# 11. Lead Detail Page

Route:

```text
/leads/:id
```

Header:

```text
Business Name
Industry
Location
Priority Badge
Pipeline Status
Owner
```

Tabs:

```text
Overview
Digital Audit
Signals
Activities
Tasks
Messages
Audit Report
Proposal
Data Sources
```

## Overview

Sections:

### Contact

```text
phone
email
website
facebook
instagram
zalo
```

### Opportunity Summary

```text
Main problem:
No independent website

Evidence:
Active business + strong local reviews + Facebook page

Recommended:
Website + direct inquiry + local SEO
```

### Scores

```text
Fit          82
Opportunity  94
Engagement   0
Priority     89
```

### Next Best Action

```text
Create personalized audit
```

---

# 12. Website Detection

When discovery does not provide reliable website:

1. check explicit provider website field;
2. validate URL;
3. resolve redirects;
4. ensure domain belongs to business;
5. manual confirmation if ambiguous.

Possible statuses:

```text
NO_WEBSITE
WEBSITE_FOUND
WEBSITE_AMBIGUOUS
WEBSITE_UNREACHABLE
SOCIAL_ONLY
MARKETPLACE_ONLY
```

Do not treat:

```text
facebook.com
instagram.com
booking.com
agoda.com
traveloka.com
shopee.vn
```

as independent website.

---

# 13. Website Audit Engine

Route/API job:

```text
POST /api/leads/:id/audit
```

Audit is asynchronous.

Job:

```text
website_audit
```

## Audit layers

### Layer 1 — HTTP

Check:

```text
status code
redirects
HTTPS
TLS reachable
www/non-www
robots.txt
sitemap.xml
```

### Layer 2 — HTML

Check:

```text
title
meta description
canonical
h1
viewport
lang
structured data
OpenGraph
favicon
contact links
forms
```

### Layer 3 — Conversion

Detect:

```text
tel:
mailto:
Zalo
Messenger
WhatsApp
booking form
quote form
CTA buttons
map
opening hours
reviews/testimonials
pricing
catalog
portfolio
```

### Layer 4 — Lighthouse / PageSpeed

Run mobile first:

```text
performance
accessibility
best-practices
seo
```

Optional desktop run only for:

- shortlisted lead;
- audit report;
- user explicitly requests.

Persist:

```text
lighthouse_version_if_available
scan_timestamp
strategy
scores
selected_metrics
```

Do not assume PSI score is stable forever.

### Layer 5 — Content heuristic

Detect presence:

```text
About
Services
Products
Portfolio
Projects
Rooms
Menu
Contact
FAQ
Blog/News
Policies
```

### Layer 6 — Technology

MVP:

self-detect basic:

```text
WordPress
WooCommerce
Shopify
Wix
Laravel indicators
Next.js
React
Google Analytics
Meta Pixel
Google Tag Manager
```

Phase 2 provider adapters:

```text
Wappalyzer
BuiltWith
```

These must be optional due to cost.

---

# 14. Screenshot Service

For qualified leads only.

Using Playwright:

```text
Desktop 1440x900
Mobile 390x844
```

Store:

```text
audit-screenshots/{leadId}/{scanId}/desktop.webp
audit-screenshots/{leadId}/{scanId}/mobile.webp
```

Rules:

- timeout;
- block huge media where possible;
- sanitize URL;
- SSRF protection;
- no private/internal IP ranges;
- max page size;
- max runtime.

---

# 15. Opportunity Engine

Core differentiator.

Input:

```text
business profile
industry
website audit
public signals
CRM history
```

Output:

```json
{
  "primary_problem": "...",
  "evidence": [],
  "opportunities": [],
  "recommended_services": [],
  "next_best_action": "...",
  "confidence": 0.0
}
```

Example:

```json
{
  "primary_problem": "No independent website",
  "evidence": [
    "Business appears active",
    "Website not found",
    "Social channel found"
  ],
  "opportunities": [
    {
      "type": "website",
      "reason": "Provide owned destination for information and conversion"
    },
    {
      "type": "local_seo",
      "reason": "Build organic visibility around local intent"
    }
  ],
  "recommended_services": [
    "Website Starter",
    "Local SEO"
  ],
  "next_best_action": "Generate short audit",
  "confidence": 0.87
}
```

AI must reference evidence IDs.

No unsupported statements.

---

# 16. Scoring Model

## 16.1 Fit Score — 0–100

Configurable.

Default:

```text
Industry Match              0–30
Target Location             0–25
Business Activity           0–20
Commercial Suitability      0–15
Contactability              0–10
```

Example:

```text
Homestay in Đà Lạt +30 industry
Target geography +25
Appears active +18
Good service fit +15
Phone/website/social +8

Fit = 96
```

---

## 16.2 Opportunity Score — 0–100

```text
No website / weak website       0–30
Conversion gaps                 0–20
Technical problems              0–15
SEO gaps                        0–15
Owned-channel gap               0–10
Industry-specific missing       0–10
```

Example no website:

```text
No website               30
No direct booking        18
SEO ownership gap        15
Social dependent          8
Industry gap             10

Opportunity = 81
```

Avoid score inflation.

Maximum points in a category must be capped.

---

## 16.3 Engagement Score — 0–100

Before outreach:

```text
0
```

After outreach:

```text
Message sent                 +5
Replied                     +20
Requested details           +15
Opened audit                +10
Repeated audit visit        +10
Requested demo              +20
Meeting booked              +20
```

Negative:

```text
No response 14 days          -10
Explicit not interested      -50
Do not contact              → suppress
```

Only count trackable/entered events.

---

## 16.4 Priority

```ts
if (engagementEvents === 0) {
  priority = fit * 0.45 + opportunity * 0.55
} else {
  priority = fit * 0.30 + opportunity * 0.35 + engagement * 0.35
}
```

Config in admin.

Priority labels:

```text
85–100  HOT
70–84   HIGH
50–69   MEDIUM
0–49    LOW
```

Labels are operational, not AI opinions.

---

# 17. Score Explainability

Every score contains:

```text
Rule
Evidence
Points
Source
```

UI:

```text
Opportunity 88

+30 No independent website
+15 Local SEO ownership gap
+13 No direct conversion form
+10 No industry booking functionality
+20 Other verified gaps
```

Button:

```text
Why this score?
```

---

# 18. AI Layer

## Model use cases

### Good AI tasks

- summarize evidence;
- classify industry;
- detect opportunity;
- generate personalized message;
- produce audit narrative;
- suggest next action;
- classify reply;
- create proposal draft.

### Do not let AI decide alone

- legal/compliance state;
- whether contact info is verified;
- numeric PageSpeed facts;
- source attribution;
- prices;
- whether a message was sent;
- won/lost status.

---

# 19. AI Prompt Contract

All AI tasks should use structured output.

Example system contract:

```text
You are SAOBEO LEAD Opportunity Analyst.

Use ONLY supplied evidence.
Do not invent contact details.
Do not claim a website is missing unless evidence says so.
Separate fact from inference.
Return JSON matching schema.
Vietnamese output should be concise and business-friendly.
```

Output:

```json
{
  "summary": "",
  "primary_gap": "",
  "supporting_evidence_ids": [],
  "recommended_services": [],
  "message_angle": "",
  "confidence": 0.0
}
```

---

# 20. Outreach Assistant

Channels:

```text
Zalo
Facebook
Email
Phone script
SMS
```

MVP creates drafts only.

Input:

```text
lead
industry
problems
evidence
offer
tone
channel
```

Output:

```text
short
normal
follow-up
```

Rules:

- do not fake familiarity;
- do not claim “I found an error” unless verified;
- do not use manipulative urgency;
- do not auto-send;
- avoid repetitive templated spam;
- include opt-out/suppression workflow where relevant.

---

# 21. Message Templates

Example logic:

```text
IF no_website
  angle = owned presence

IF poor_mobile
  angle = mobile experience

IF slow_site
  angle = performance

IF no_conversion
  angle = lost inquiry opportunities

IF hotel AND no_direct_booking
  angle = direct inquiry / owned booking path

IF construction AND weak_portfolio
  angle = project credibility
```

Never include 5 problems in first message.

Choose ONE strongest angle.

---

# 22. CRM Pipeline

Default stages:

```text
NEW
QUALIFIED
CONTACTED
REPLIED
INTERESTED
AUDIT_SENT
DEMO_SENT
QUOTATION
NEGOTIATION
WON
LOST
```

Stage transitions generate events.

Example:

```text
DEMO_SENT
→ create follow-up +3 days
```

Configurable later.

---

# 23. Activities

Types:

```text
NOTE
CALL
ZALO
FACEBOOK
EMAIL
MEETING
AUDIT_SENT
DEMO_SENT
PROPOSAL_SENT
STATUS_CHANGED
TASK_COMPLETED
```

Schema:

```text
id
lead_id
user_id
type
summary
metadata_json
occurred_at
created_at
```

---

# 24. Tasks & Follow-up

Task:

```text
title
lead
due_at
priority
assigned_to
status
```

Defaults:

```text
after first outreach → +3 days
after reply → +1 day
after audit sent → +2 days
after proposal → +2 days
```

No automatic outreach.

Automatic reminders allowed.

---

# 25. Audit Report

Public URL:

```text
https://lead.saobeo.com/r/{publicToken}
```

Report:

```text
Business
Executive Summary
Current Online Presence
3 Key Findings
Mobile Screenshot
Website Health
Growth Opportunities
Recommended Improvements
CTA
```

CTA:

```text
Nhận bản demo
Đặt lịch trao đổi
Liên hệ Sao Béo
```

Analytics:

```text
first_opened_at
last_opened_at
view_count
cta_clicks
```

Do not use invasive fingerprinting.

---

# 26. Demo Generator — Phase 2

Input:

```text
business name
industry
verified public assets
approved copy
brand colors
services
```

Output:

```text
demo.saobeo.com/{slug}
```

Use prebuilt industry templates.

Do not generate a full WordPress install per lead.

Generate static/Next.js previews.

Templates:

```text
homestay
hotel
farm
construction
spa
restaurant
```

---

# 27. Proposal Generator — Phase 2

Proposal contains:

```text
Current situation
Objectives
Recommended solution
Scope
Timeline
Price
Optional services
Payment terms
Next step
```

Price comes from configured service catalog, not AI.

---

# 28. Service Catalog

Schema:

```text
service_packages
```

Fields:

```text
id
name
category
base_price
price_type
description
features_json
active
```

Example:

```text
Website Starter
Website Pro
Hotel/Homestay Website
Website Redesign
Local SEO
SEO Monthly
Landing Page
Google Ads Setup
Facebook Ads Setup
Maintenance
```

Opportunity engine maps problems to packages.

---

# 29. Data Model

Recommended DB:

```text
PostgreSQL
```

ORM:

```text
Prisma
```

---

# 30. Core Tables

## users

```text
id uuid pk
email unique
name
password_hash nullable
role
created_at
updated_at
```

## workspaces

```text
id
name
slug
created_at
```

## workspace_members

```text
workspace_id
user_id
role
```

## leads

```text
id
workspace_id

business_name
business_name_normalized

industry_id
location_text

domain
website_url

phone
email
facebook_url
instagram_url
zalo_url

pipeline_stage
owner_user_id

fit_score
opportunity_score
engagement_score
priority_score

data_quality_score

next_action
next_action_at

created_at
updated_at
archived_at
```

## external_identities

```text
id
lead_id
provider
external_id
last_refreshed_at
```

## lead_sources

```text
id
lead_id
source_type
source_name
source_url
retrieved_at
confidence
metadata_json
```

## discovered_businesses

Temporary/discovery-oriented records.

```text
id
workspace_id
provider
external_id
display_name
search_session_id
transient_payload_json
expires_at
created_at
```

## search_sessions

```text
id
workspace_id
user_id
provider
query_json
result_count
estimated_cost
created_at
```

## website_scans

```text
id
lead_id
url
status
started_at
finished_at

http_json
html_json
conversion_json
technology_json
content_json

mobile_screenshot_url
desktop_screenshot_url

scanner_version
```

## lighthouse_runs

```text
id
website_scan_id
strategy
performance
accessibility
best_practices
seo
metrics_json
raw_ref
created_at
```

## score_runs

```text
id
lead_id
score_type
score
rules_version
breakdown_json
created_at
```

## opportunity_analyses

```text
id
lead_id
website_scan_id
primary_problem
summary
recommendations_json
evidence_json
confidence
model
prompt_version
created_at
```

## activities

See section 23.

## tasks

```text
id
lead_id
assigned_to
title
description
priority
status
due_at
completed_at
created_at
```

## message_drafts

```text
id
lead_id
channel
tone
body
model
prompt_version
approved_at
sent_at nullable
created_at
```

## audit_reports

```text
id
lead_id
public_token unique
version
status
content_json
published_at
created_at
```

## report_events

```text
id
audit_report_id
event_type
occurred_at
metadata_json
```

## service_packages

See section 28.

## proposals

```text
id
lead_id
status
currency
subtotal
discount
total
content_json
public_token
created_at
sent_at
won_at
lost_at
```

## api_usage

```text
id
workspace_id
provider
operation
units
estimated_cost
lead_id nullable
search_session_id nullable
created_at
```

## suppression_list

```text
id
workspace_id
type
normalized_value
reason
created_at
```

---

# 31. Data Quality

Every lead gets:

```text
data_quality_score 0–100
```

Based on:

```text
business identity confidence
website verification
phone verification
email verification
source freshness
conflicting values
```

UI badge:

```text
Verified
Good
Needs Review
Low Confidence
```

---

# 32. API Design

Base:

```text
/api/v1
```

## Discovery

```text
POST /discovery/search
GET  /discovery/sessions/:id
POST /discovery/:id/qualify
POST /discovery/:id/create-lead
```

## Leads

```text
GET    /leads
POST   /leads
GET    /leads/:id
PATCH  /leads/:id
DELETE /leads/:id
```

DELETE in UI should default to archive unless privacy deletion required.

## Audit

```text
POST /leads/:id/audits
GET  /leads/:id/audits
GET  /audits/:id
```

## Analysis

```text
POST /leads/:id/opportunity-analysis
POST /leads/:id/rescore
```

## AI messages

```text
POST /leads/:id/messages/generate
POST /messages/:id/approve
```

## Activities

```text
GET  /leads/:id/activities
POST /leads/:id/activities
```

## Tasks

```text
GET   /tasks
POST  /tasks
PATCH /tasks/:id
```

## CRM

```text
PATCH /leads/:id/stage
GET   /pipeline
```

## Reports

```text
POST /leads/:id/audit-report
GET  /public/reports/:token
```

## Usage

```text
GET /usage
```

---

# 33. Async Jobs

Queue:

```text
BullMQ + Redis
```

Job types:

```text
DISCOVERY_SEARCH
WEBSITE_SCAN
LIGHTHOUSE_MOBILE
LIGHTHOUSE_DESKTOP
SCREENSHOT
TECH_DETECTION
OPPORTUNITY_ANALYSIS
LEAD_RESCORE
AUDIT_REPORT_BUILD
```

Job requirements:

```text
retry policy
timeout
idempotency
status
error reason
cost logging
```

---

# 34. Suggested Stack

## Web

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
TanStack Table
React Hook Form
Zod
```

## Backend

MVP:

```text
Next.js Route Handlers / Server Actions
```

Avoid NestJS until scale justifies it.

## Database

```text
PostgreSQL
Prisma
```

Recommended managed option:

```text
Supabase Postgres
```

## Queue

```text
Redis
BullMQ
```

Can defer queue until audit volume increases, but API design must already be async-compatible.

## Browser worker

```text
Playwright
```

Run on separate worker/VPS if Vercel runtime becomes limiting.

## Storage

```text
Cloudflare R2
```

or Supabase Storage.

## AI

Provider adapter:

```ts
interface AIProvider {
  structured<T>(task: AITask<T>): Promise<T>
}
```

Do not hard-code model names throughout codebase.

---

# 35. Suggested Repository

```text
saobeo-lead/
├─ apps/
│  ├─ web/
│  └─ worker/
├─ packages/
│  ├─ db/
│  ├─ ui/
│  ├─ scoring/
│  ├─ audit/
│  ├─ discovery/
│  ├─ ai/
│  ├─ providers/
│  └─ shared/
├─ prisma/
├─ docs/
├─ tests/
└─ docker/
```

For MVP single repo Next.js is acceptable:

```text
src/
├─ app/
├─ components/
├─ features/
│  ├─ discovery/
│  ├─ leads/
│  ├─ audits/
│  ├─ scoring/
│  ├─ crm/
│  └─ ai/
├─ lib/
├─ server/
└─ jobs/
```

Do not over-engineer monorepo before feature parity.

---

# 36. Provider Adapter Architecture

```ts
interface PlaceDiscoveryProvider {}

interface WebsiteIntelligenceProvider {}

interface PagePerformanceProvider {}

interface ContactEnrichmentProvider {}

interface AIProvider {}
```

Initial:

```text
Google Places
Internal crawler
PageSpeed Insights
Internal technology detector
OpenAI-compatible AI adapter
```

Optional:

```text
Wappalyzer
BuiltWith
other enrichment providers
```

No vendor should be required for core CRM operation.

---

# 37. Cost Control

Settings:

```text
Daily discovery budget
Daily enrichment budget
Max PageSpeed calls
Max AI calls
Max screenshots
```

Before bulk operation show:

```text
20 leads selected

Estimated:
20 lightweight audits
8 PageSpeed runs
8 AI analyses
```

Button:

```text
Run Analysis
```

Feature flags:

```text
run_pagespeed
run_desktop_pagespeed
run_technology_provider
run_ai_analysis
take_screenshots
```

---

# 38. Search Cost Strategy

Discovery:

```text
minimum fields
```

Then shortlist.

Detailed enrichment only after:

```text
user selects
OR
basic fit threshold passes
```

Never:

```text
Search 1000
→ Full audit 1000
→ AI analyze 1000
```

Default:

```text
Search 100
→ qualify 30
→ web detect 30
→ full audit 10
→ AI 10
```

---

# 39. Security

## Must-have

- API keys server-side only.
- Encrypted secret storage.
- CSRF protection where relevant.
- Rate limiting.
- RBAC.
- Input validation with Zod.
- Audit logs for sensitive settings.
- Passwordless/auth provider preferred.
- Secure cookies.
- CSP.
- SSRF protection for crawler.
- Block localhost/private IP ranges.
- File MIME validation.
- No arbitrary shell execution.

## URL scanner protection

Reject:

```text
localhost
127.0.0.0/8
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
169.254.0.0/16
::1
private/reserved ranges
```

Resolve DNS before fetch and verify again after redirect.

---

# 40. Privacy & Outreach Compliance

Vietnam's Law on Personal Data Protection (Law 91/2025/QH15) took effect on 2026-01-01, with Decree 356/2025/NĐ-CP providing detailed implementation.

Therefore SAOBEO LEAD should be privacy-aware by design.

Minimum features:

```text
Data source tracking
Suppression / Do-not-contact list
Delete lead
Export lead data
Retention controls
Purpose field
Activity logs
Access control
```

Contact data that identifies a natural person must not be treated casually just because it appears publicly.

Do not build hidden personal profiling unrelated to the sales purpose.

## Retention

Configurable defaults:

```text
Rejected discovery data       short-lived
Unqualified lead              90–180 days
Active CRM lead               business need
Suppressed contact key        retain minimal key to prevent re-contact
```

Final retention policy should be reviewed with Vietnamese legal counsel before commercial SaaS launch.

---

# 41. Data Provenance

Every field displayed should be capable of showing:

```text
Source: Website
Checked: 17/09/2026
Confidence: High
```

For AI:

```text
Source: AI inference
Evidence: [E12, E14]
Confidence: 82%
```

Do not show AI inference as a verified fact.

---

# 42. Research / Evidence Objects

Create normalized evidence:

```text
evidence_items
```

Fields:

```text
id
lead_id
type
claim
value_json
source_type
source_url
captured_at
confidence
website_scan_id nullable
```

Examples:

```text
website_missing
has_facebook
mobile_performance_score
has_contact_form
has_booking
wordpress_detected
```

Opportunity and AI reports refer to evidence IDs.

---

# 43. UI Design System

Direction:

```text
Linear
Apollo
HubSpot
Clay
```

Not WordPress admin.

## Style

```text
Font: Inter
Radius: 10–12px
Dense data tables
Clear hierarchy
Neutral background
Single accent color
```

## Status badges

Use semantic tokens, not hardcoded random colors.

```text
hot
high
medium
low
success
warning
danger
neutral
```

## Mobile

Mobile supports:

```text
Dashboard
Lead Detail
Tasks
Quick activity
Pipeline update
```

Desktop required for:

```text
Discovery table
Bulk audit
Settings
```

---

# 44. Key Screens

## Screen 1 — Login

Minimal.

## Screen 2 — Dashboard

KPI + tasks + hot opportunities.

## Screen 3 — Find Leads

Search panel + result table.

## Screen 4 — Lead Inbox

Qualify/reject/create CRM.

## Screen 5 — Lead Detail

Core workspace.

## Screen 6 — Digital Audit

Visual score cards + evidence.

## Screen 7 — CRM Kanban

Drag/drop pipeline.

## Screen 8 — Tasks

Today / Overdue / Upcoming.

## Screen 9 — Audit Builder

Preview + publish.

## Screen 10 — Settings / Scoring

Editable rules.

---

# 45. CRM Kanban Requirements

Card:

```text
Business
Industry
Priority
Main opportunity
Last activity
Next task
Owner
```

Drag stage.

On stage change:

```text
create activity
update stage
optionally create task
```

Do not silently trigger outbound messages.

---

# 46. Filters

Global lead filters:

```text
Location
Industry
Pipeline
Priority
Fit
Opportunity
Engagement
Website status
Last activity
Next task
Owner
Source
```

Saved views:

```text
Hot Leads
No Website
Website Redesign
Needs Follow-up
Audit Viewed
Proposal Sent
Stale Leads
```

---

# 47. Smart Search — Phase 2

Natural language:

```text
"Tìm homestay Đà Lạt không có website, rating tốt"
```

AI converts only into supported filters.

Output:

```json
{
  "location": "Đà Lạt",
  "industry": ["homestay"],
  "websiteStatus": "NO_WEBSITE",
  "ratingMin": 4
}
```

Show parsed filters before search.

Never let AI send uncontrolled provider queries directly.

---

# 48. Reporting

MVP reports:

```text
Lead source → qualified
Qualified → contacted
Contacted → replied
Replied → meeting
Proposal → won
Revenue by industry
Revenue by location
Average days to close
```

Later:

```text
Opportunity type → close rate
Message angle → reply rate
Audit viewed → close rate
```

---

# 49. Learning Loop

When lead closes:

capture:

```text
won_reason
service_sold
deal_value
industry
initial_scores
key_gap
source
```

When lost:

```text
lost_reason
price
timing
no_need
no_response
competitor
other
```

Use aggregated outcomes to improve scoring.

Do not introduce machine learning until dataset is large enough.

Initial scoring stays rule-based and explainable.

---

# 50. MVP Scope

## INCLUDED

### Authentication
- Login
- Single workspace
- Admin role

### Discovery
- Google Places adapter
- Locations
- Industries
- Saved search

### Lead Inbox
- Qualify
- Reject
- Deduplicate
- Create CRM lead

### Website Audit
- HTTP
- HTML
- conversion
- basic SEO
- mobile PageSpeed
- screenshot

### Scores
- Fit
- Opportunity
- Priority

### AI
- Opportunity summary
- Recommended service
- Outreach draft

### CRM
- pipeline
- activities
- tasks
- follow-up

### Audit Report
- basic public report

### Usage
- API call logging

---

# 51. EXCLUDED FROM MVP

Do not implement unless MVP finished:

```text
Auto-email campaigns
Auto-Zalo sending
Facebook automation
LinkedIn automation
AI voice calls
Browser extension
SaaS subscriptions
Multi-tenant billing
Advanced team permission
Full website generator
Automatic WordPress deployment
Predictive ML scoring
Contact database resale
Mass scraping
```

---

# 52. Implementation Phases

## Phase 0 — Foundation

Deliver:

```text
Next.js project
DB
Prisma
Auth
Layout
Design tokens
Environment config
Logging
Error handling
```

Acceptance:

- app boots;
- auth works;
- migration works;
- deployment works.

---

## Phase 1 — CRM Core

Deliver:

```text
leads
lead detail
pipeline
activities
tasks
filters
```

Acceptance:

- create/edit/archive lead;
- drag pipeline;
- add note;
- create follow-up;
- view overdue tasks.

---

## Phase 2 — Discovery

Deliver:

```text
Google Places provider
search session
Lead Inbox
dedupe
saved searches
```

Acceptance:

- search by location + category;
- results render;
- cost/usage logged;
- duplicates detected;
- selected result creates CRM lead.

---

## Phase 3 — Website Audit

Deliver:

```text
URL validation
HTTP scan
HTML scan
conversion scan
PageSpeed mobile
screenshots
audit UI
```

Acceptance:

- scan does not block web request;
- status visible;
- failures recover gracefully;
- scan evidence stored;
- malicious/private URL blocked.

---

## Phase 4 — Scoring

Deliver:

```text
rules engine
fit score
opportunity score
priority
explainability UI
```

Acceptance:

- deterministic;
- versioned;
- same input gives same score;
- every point traceable to rule/evidence.

---

## Phase 5 — AI Assistant

Deliver:

```text
opportunity analysis
message generator
structured outputs
prompt versioning
```

Acceptance:

- no invented phone/email;
- evidence IDs required;
- JSON validated;
- retry invalid response;
- manual approval before send.

---

## Phase 6 — Audit Report

Deliver:

```text
public token
report renderer
view tracking
CTA tracking
```

Acceptance:

- no auth required for public token;
- token not enumerable;
- report can be unpublished;
- event logs visible.

---

# 53. Test Strategy

## Unit

```text
scoring
normalization
dedupe
URL validation
industry rules
```

## Integration

```text
discovery adapter
PageSpeed adapter
AI structured output
DB transactions
jobs
```

## E2E

Playwright:

```text
login
search
qualify
create lead
scan
generate message
move pipeline
create task
publish audit
```

## Security tests

```text
SSRF
XSS
invalid redirect
private network URL
API key exposure
public token guessing
rate limit
```

---

# 54. Observability

Use structured logs.

Fields:

```text
request_id
job_id
workspace_id
user_id
lead_id
provider
duration
status
cost
```

Track:

```text
API errors
audit failures
AI invalid JSON
job retry count
provider latency
```

---

# 55. Feature Flags

```text
FEATURE_GOOGLE_PLACES
FEATURE_PAGESPEED
FEATURE_SCREENSHOT
FEATURE_AI
FEATURE_PUBLIC_AUDIT
FEATURE_WAPPALYZER
FEATURE_BUILTWITH
FEATURE_DEMO_GENERATOR
```

Allows incremental rollout.

---

# 56. Environment Variables

Example:

```bash
DATABASE_URL=
DIRECT_URL=

AUTH_SECRET=

GOOGLE_MAPS_API_KEY=
PAGESPEED_API_KEY=

AI_API_KEY=

REDIS_URL=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
```

Never commit `.env`.

Create:

```text
.env.example
```

without secrets.

---

# 57. Search Presets for Sao Béo

Seed:

## Đức Trọng

```text
construction
interior
farm
agriculture store
restaurant
cafe
spa
clinic
```

## Đà Lạt

```text
homestay
hotel
villa
tour
cafe
restaurant
spa
wedding service
farm experience
```

---

# 58. Starter Opportunity Rules

## No Website

IF:

```text
website_status = NO_WEBSITE
AND business_activity_confidence >= medium
```

THEN:

```text
website opportunity +30
recommended service = website
```

## Weak Mobile

IF:

```text
mobile_performance < threshold
OR viewport_missing
OR mobile screenshot visibly unusable with verified heuristic
```

THEN:

```text
redesign opportunity
```

## No CTA

IF:

```text
no tel
no contact form
no primary CTA
```

THEN:

```text
conversion gap
```

## Homestay / Hotel

IF:

```text
industry in [hotel, homestay]
AND no booking/inquiry path
```

THEN:

```text
direct booking / inquiry opportunity
```

## Construction

IF:

```text
industry = construction
AND no portfolio/projects
```

THEN:

```text
portfolio credibility opportunity
```

## Farm

IF:

```text
industry = farm
AND no product/catalog/service structure
```

THEN:

```text
catalog/B2B landing opportunity
```

---

# 59. Recommended Homepage Dashboard Copy

```text
Good afternoon.

12 leads need attention.
5 are high-priority opportunities.
3 follow-ups are overdue.
```

Primary button:

```text
Find Leads
```

Secondary:

```text
View Today's Tasks
```

---

# 60. Empty States

No leads:

```text
Chưa có lead.
Bắt đầu bằng cách tìm doanh nghiệp tại Đức Trọng hoặc Đà Lạt.
[ Tìm khách hàng ]
```

No audit:

```text
Chưa phân tích website.
[ Chạy Website Audit ]
```

No task:

```text
Không có follow-up đến hạn.
```

---

# 61. Error UX

Provider failure:

```text
Không thể lấy dữ liệu từ nguồn tìm kiếm.
Dữ liệu CRM hiện tại không bị ảnh hưởng.
[ Thử lại ]
```

Audit failure:

```text
Website không phản hồi trong thời gian cho phép.
Status: TIMEOUT
```

AI failure:

```text
Không tạo được phân tích AI.
Các dữ liệu audit vẫn được giữ nguyên.
```

No silent failures.

---

# 62. Product Metrics

Track:

```text
searches/week
discovered/search
qualified/discovered
audited/qualified
contacted/qualified
reply/contacted
meeting/replied
proposal/meeting
won/proposal
revenue/won
```

Operational:

```text
cost/qualified lead
cost/won lead
AI cost
Places cost
audit cost
```

---

# 63. Initial Success Criteria

After 30 days of real use:

```text
>= 100 qualified local businesses reviewed
>= 30 personalized outreaches
>= 10 replies
>= 5 sales conversations
```

These are operational targets, not guaranteed outcomes.

More important:

- Is lead qualification faster?
- Are messages more specific?
- Are follow-ups missed less often?
- Can high-opportunity leads be identified reliably?

---

# 64. Codex Working Rules

Codex must:

1. Read this spec before coding.
2. Implement phase-by-phase.
3. Do not add unrequested frameworks.
4. Do not build Phase 2/3 features early.
5. Preserve database migrations.
6. Write tests for scoring/dedupe.
7. Run lint/typecheck/test after each milestone.
8. Never expose API secrets.
9. Never add mass outreach automation in MVP.
10. Keep provider APIs behind adapters.

For each phase:

```text
PLAN
FILES TO CHANGE
IMPLEMENT
TEST
RESULT
KNOWN LIMITATIONS
```

---

# 65. Codex First Execution Prompt

Use this as the first prompt:

```text
You are implementing SAOBEO LEAD.

Read SAOBEO-LEAD-SPEC.md completely.

Implement ONLY Phase 0 and Phase 1.

Requirements:
- Next.js + TypeScript
- Tailwind + shadcn/ui
- PostgreSQL + Prisma
- Authentication
- CRM leads
- lead detail
- pipeline stages
- activities
- tasks/follow-ups
- filters
- clean desktop-first UI
- responsive lead/task views

Do not implement:
- Google Places
- PageSpeed
- AI
- Wappalyzer/BuiltWith
- email sending
- Zalo sending
- demo generator

Before coding:
1. summarize architecture;
2. list files/modules to create;
3. identify assumptions.

After coding:
1. run typecheck;
2. run lint;
3. run tests;
4. report migration steps;
5. provide local setup instructions.

Use an adapter-friendly architecture so discovery/audit/AI can be added in later phases.
```

---

# 66. Phase 2 Codex Prompt

```text
Read SAOBEO-LEAD-SPEC.md.

Implement Phase 2 — Discovery.

Add:
- provider interface
- Google Places provider
- search sessions
- Lead Inbox
- qualification
- deduplication
- saved searches
- API usage logging

Important:
- request minimal required provider fields;
- server-side API key only;
- preserve source attribution;
- avoid building a permanent Google Maps mirror;
- store provider identity/place id as allowed reference;
- keep transient discovery payload separate from CRM-owned data;
- add error handling and usage logs.

Do not implement AI or outreach automation.
```

---

# 67. Phase 3 Codex Prompt

```text
Read SAOBEO-LEAD-SPEC.md.

Implement Phase 3 — Website Audit.

Add:
- safe URL validation
- SSRF protection
- HTTP audit
- HTML/SEO audit
- conversion feature detection
- PageSpeed Insights mobile integration
- Playwright mobile + desktop screenshots
- async jobs
- website scan UI
- evidence objects

Store scan timestamp and version metadata.

Do not allow crawler access to private/local networks.

Add automated tests for URL validation and SSRF blocking.
```

---

# 68. Phase 4–5 Codex Prompt

```text
Read SAOBEO-LEAD-SPEC.md.

Implement:
Phase 4 Scoring
then
Phase 5 AI Assistant.

Scoring must be deterministic and versioned.

Add:
- Fit Score
- Opportunity Score
- Engagement Score
- Priority Score
- score breakdown
- admin-configurable thresholds

AI:
- structured JSON only;
- validate with Zod;
- evidence IDs required;
- no invented facts;
- prompt versioning;
- message drafts require manual approval.

Do not add auto-send.
```

---

# 69. Research References Used for This Specification

## Google Places

- Places data fields / FieldMask / SKU concept:
  https://developers.google.com/maps/documentation/places/web-service/data-fields

- Places API policies and attribution:
  https://developers.google.com/maps/documentation/places/web-service/policies

- Place IDs and storage/refresh:
  https://developers.google.com/maps/documentation/places/web-service/place-id

## Website performance

- PageSpeed Insights API v5:
  https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed

- PageSpeed Insights release notes:
  https://developers.google.com/speed/docs/insights/release_notes

## Lead scoring / GTM patterns

- Apollo Scores:
  https://knowledge.apollo.io/hc/en-us/articles/4988048582285-Scores-Overview

- HubSpot lead scoring:
  https://knowledge.hubspot.com/scoring/build-lead-scores

- Clay waterfall enrichment:
  https://university.clay.com/docs/building-a-data-waterfall

## Website intelligence providers

- Wappalyzer API:
  https://www.wappalyzer.com/docs/api/v2/lookup/

- BuiltWith API:
  https://api.builtwith.com/

## Vietnam personal data protection

- Law 91/2025/QH15:
  https://vanban.chinhphu.vn/?classid=1&docid=214590&orggroupid=1&pageid=27160

- Decree 356/2025/NĐ-CP:
  https://vanban.chinhphu.vn/?docid=216387&pageid=27160&typegroupid=4

---

# 70. Final Product Positioning

Internal positioning:

> SAOBEO LEAD là hệ thống tìm và ưu tiên doanh nghiệp địa phương có nhu cầu chuyển đổi số, sau đó biến dữ liệu thành cơ hội bán hàng có hành động cụ thể.

Không định vị:

> tool cào số điện thoại Google Maps.

Positioning future SaaS:

> Local Opportunity Intelligence for agencies.

Core moat:

```text
Local discovery
+
Website intelligence
+
Industry-specific opportunity rules
+
Explainable scoring
+
Personalized sales workflow
+
Outcome learning
```

---

# 71. Recommended Immediate Build Order

```text
1. CRM
2. Tasks/follow-up
3. Lead discovery
4. Website detection
5. Website audit
6. Explainable scoring
7. AI opportunity summary
8. AI outreach draft
9. Audit public link
10. Demo generator
```

Do not invert this order.

A beautiful AI demo generator without a reliable lead/CRM/evidence layer will produce impressive demos but weak business operations.

SAOBEO LEAD should first become a tool that Sao Béo personally uses every day.

Only after the internal workflow is proven should it become a SaaS product.
