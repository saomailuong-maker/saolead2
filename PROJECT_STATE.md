# SAOBEO LEAD — Project State

Last updated: 2026-09-17
Commit: chưa có (thư mục hiện không phải Git repository)
Branch: chưa có

## Current Phase
Phase 1 — CRM Core; đang ổn định môi trường phát triển trước Phase 2.

## Runtime
- Mục tiêu: Node.js 22 LTS, Docker Desktop, PostgreSQL 17.
- Hiện tại trên máy này: Node.js 24.13.0; Docker CLI chưa cài/không có trong PATH.
- Next.js 16.3.5; Prisma 6.19.3.

## Working
- Source và production build của login admin, dashboard, lead, pipeline, activities, tasks.
- Prisma schema, migration ban đầu và seed script có sẵn.
- Docker Compose cấu hình PostgreSQL 17; chưa chạy được trên máy này.

## Not Implemented
- Discovery, Lead Inbox, audit, scoring, AI, outreach drafts, public reports.

## Known Issues
- Chưa xác nhận migration/seed và luồng đăng nhập trên DB thật vì máy này chưa có Docker/PostgreSQL.
- Chưa xác nhận trên Node.js 22 LTS; máy này dùng Node.js 24.13.0.
- Chưa có Git repository/GitHub remote để tạo baseline.

## Verification
- `npm ci`: PASS; `postinstall` tạo Prisma Client thành công.
- `npx prisma validate`: PASS với `DATABASE_URL` mẫu trong tiến trình.
- `docker compose up -d db`: BLOCKED — PowerShell không nhận diện lệnh `docker`.
- `npx prisma migrate deploy`: BLOCKED — không có `.env`/DB; với URL mẫu, Prisma báo `Schema engine error` do không có PostgreSQL tại localhost:5432.
- `npm run seed`: BLOCKED — chưa có `ADMIN_EMAIL` và `ADMIN_PASSWORD` thật; script dừng với thông báo yêu cầu mật khẩu ít nhất 12 ký tự.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS (1 test).
- `npm run build`: PASS.

## Last Completed Task
Tạo Phase 0–1 CRM ban đầu.

## Current Task
Task A — đã thêm Compose, hướng dẫn và bước Prisma generate tự động; xác minh DB thực tế còn bị chặn bởi môi trường.

## Next Task
Cài Docker Desktop và Node.js 22 LTS trên máy phát triển; chạy migration, seed, đăng nhập và kiểm tra lại. Sau đó tạo Git baseline và private GitHub repository. Chỉ khi Task A qua mới bắt đầu Phase 2A.

## Important Decisions
- GitHub private repository sẽ là nguồn chính sau khi tạo baseline.
- PostgreSQL chạy trong Docker; Next.js chạy trực tiếp trên Windows.
- Không tự động gửi outreach trong MVP.
- Không nâng cấp framework nếu không có lỗi chặn cụ thể.
