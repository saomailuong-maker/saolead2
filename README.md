# SAOBEO LEAD

CRM nội bộ Phase 0–1. Gồm đăng nhập admin, lead, hoạt động, pipeline kéo thả, task/follow-up và bộ lọc. Bối cảnh sản phẩm: [spec](./.md/SAOBEO-LEAD-SPEC.md). Trạng thái dự án: [PROJECT_STATE.md](./PROJECT_STATE.md).

## Yêu cầu trên Windows

- Git, Node.js 22 LTS, Docker Desktop với WSL 2 backend.
- Chỉ PostgreSQL chạy trong Docker; Next.js chạy trực tiếp bằng `npm run dev`.

## Thiết lập từ bản clone sạch

Trong PowerShell tại thư mục dự án:

```powershell
docker compose up -d db
npm ci
Copy-Item .env.example .env
```

Sửa `.env`: đặt `ADMIN_EMAIL` thật và `ADMIN_PASSWORD` riêng, dài ít nhất 12 ký tự. `DATABASE_URL` mẫu khớp với PostgreSQL trong Compose. Chờ DB khỏe bằng `docker compose ps` (trạng thái `healthy`), rồi chạy:

```powershell
npx prisma migrate deploy
npm run seed
npm run dev
```

Mở `http://localhost:3000` và đăng nhập bằng email/mật khẩu đã đặt. Seed có thể chạy lại; nó cập nhật mật khẩu admin cùng email. Không commit `.env`.

Nếu cổng 5432 đã được dùng, đổi vế trái của mapping cổng trong `docker-compose.yml` và cổng trong `DATABASE_URL` cho khớp. Xem DB bằng `npx prisma studio`. Dừng DB bằng `docker compose down`; dữ liệu vẫn nằm trong volume. **Không** chạy `docker compose down -v` nếu cần giữ dữ liệu.

## Kiểm tra

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Khi thay đổi schema ở môi trường phát triển, tạo migration mới bằng `npx prisma migrate dev --name <ten-migration>`. Trên bản clone hoặc môi trường triển khai, dùng `npx prisma migrate deploy`.

Ứng dụng hiện chỉ dành cho một workspace admin. Trước khi đưa lên Internet cần HTTPS, giới hạn thử đăng nhập, dọn session hết hạn, sao lưu DB và quản lý bí mật an toàn.

## Google Places Discovery

Để dùng `/discover`, tạo Google Cloud project, bật **Places API (New)**, cấu hình billing và tạo API key giới hạn cho Places API (New). Thêm `GOOGLE_MAPS_API_KEY` vào `.env` cục bộ; không đưa key vào Git. Khởi động lại `npm run dev` sau khi sửa `.env`. Không có key, trang hiển thị thông báo cấu hình thay vì gọi Google.

Mỗi lượt tìm chỉ lấy place ID, tên, địa chỉ và loại hình. Search session lưu place ID; Lead Inbox lấy nội dung Google khi hiển thị và yêu cầu xác nhận thông tin trước khi tạo CRM lead. Không lưu payload Places đầy đủ trong database. Google có thể tính phí theo số request và field mask.
