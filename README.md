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

Transport hiện tại là RapidAPI Google Map Places (New V2). Cấu hình `.env` cục bộ và khởi động lại `npm run dev`:

```env
PLACES_TRANSPORT="rapidapi"
RAPIDAPI_KEY="YOUR_KEY"
RAPIDAPI_HOST="google-map-places-new-v2.p.rapidapi.com"
```

Không đưa key vào Git. Basic plan có giới hạn cứng 100 request/ngày; mỗi lần bấm tìm tạo đúng một request và tối đa 20 kết quả. Direct Google adapter vẫn được giữ làm fallback bằng `PLACES_TRANSPORT="direct-google"` cùng `GOOGLE_MAPS_API_KEY`.

RapidAPI Text Search chỉ lấy place ID, tên và địa chỉ. Khi người dùng chọn một kết quả để đưa vào Lead Inbox, ứng dụng gọi thêm đúng một Place Details request và lưu các trường cần thiết như điện thoại, website, rating, số đánh giá và giờ mở cửa. CRM Lead được tạo từ Inbox sẽ tự điền điện thoại và website; email vẫn để trống để nhập thủ công. Không gọi Place Details cho các kết quả chưa được chọn.

Các khu vực tìm kiếm preset dùng `locationRestriction.rectangle` theo vùng bán hàng cấu hình sẵn, sau đó lọc lại bằng tọa độ và địa chỉ. Search session được đưa vào URL `/discover?session=...`; refresh khôi phục kết quả đã lưu mà không gọi lại RapidAPI. `/discover` hiển thị trạng thái request và quota an toàn khi provider gửi các header tương ứng; `/system-status` cung cấp kiểm tra hệ thống có xác thực.

## Website Audit

Lead Detail có mục **Website Audit** để quét HTML của trang chủ hiện tại và lưu lịch sử kết quả. Audit thu thập thông tin HTTP, SEO cơ bản, tín hiệu liên hệ/chuyển đổi, cấu trúc liên kết và tạo findings theo quy tắc cố định. URL được kiểm tra DNS và chặn địa chỉ nội bộ trước mỗi request và redirect; mỗi scan giới hạn 5 redirect, khoảng 10 giây và 2 MB HTML.

Ngay dưới kết quả audit, **Cơ hội đề xuất** chuyển Lead và bằng chứng từ lần quét gần nhất thành một danh sách ngắn các cơ hội bán hàng theo quy tắc cố định. Mỗi cơ hội hiển thị lý do, dịch vụ gợi ý và mã bằng chứng; chưa có điểm số hoặc nội dung AI.

**Điểm ưu tiên** tổng hợp khả năng liên hệ, sức mạnh cơ hội và trạng thái bán hàng thành điểm 0–100 có giải thích. Danh sách Leads có thể lọc HOT/WARM/LOW và sắp xếp theo ưu tiên; WON/LOST được đánh dấu CLOSED và không được xếp như lead đang hoạt động.

Liên kết Facebook, Instagram, Zalo, TikTok, LinkedIn và YouTube được nhận diện là kênh mạng xã hội. Chúng không được tính như website riêng, không được Website Audit phân tích và không tạo cơ hội chất lượng website giả.
