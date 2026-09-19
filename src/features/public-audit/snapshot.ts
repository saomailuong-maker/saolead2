import { classifyBusinessUrl } from "../../lib/url-classification";
import type { LeadOpportunity, OpportunityResult } from "../opportunities/types";
import type { SalesStrategy } from "../sales-assistant/types";
import type { AuditChecks } from "../website-audit/types";
import { publicAuditSnapshotSchema, type PublicAuditSnapshot } from "./types";

type SnapshotLead = { businessName: string; industry: string | null; locationText: string | null; websiteUrl: string | null; phone: string | null; facebookUrl: string | null; instagramUrl: string | null; zaloUrl: string | null; sourceType: string | null };
type SnapshotScan = { status: string; createdAt: Date; checks: AuditChecks | null } | null;

const observationCopy: Partial<Record<LeadOpportunity["type"], { title: string; detail: string }>> = {
  CONTACT_CONVERSION: { title: "Lời mời liên hệ chưa thật sự nổi bật", detail: "Trong lần kiểm tra trang chủ, chưa tìm thấy lời mời liên hệ rõ ràng giúp khách biết bước tiếp theo." },
  CLICK_TO_CALL: { title: "Chưa thấy nút gọi trực tiếp nổi bật", detail: "Trong lần kiểm tra trang chủ, khách chưa có một đường gọi nhanh rõ ràng trên thiết bị di động." },
  DIRECT_BOOKING: { title: "Luồng hỏi phòng hoặc đặt phòng chưa rõ", detail: "Trong lần kiểm tra trang chủ, chưa tìm thấy hướng đi rõ ràng để khách bắt đầu hỏi hoặc đặt phòng trực tiếp." },
  LOCAL_CONTACT: { title: "Thông tin liên hệ có thể được làm rõ hơn", detail: "Trong lần kiểm tra trang chủ, các lựa chọn liên hệ trực tiếp chưa xuất hiện rõ ràng." },
  MOBILE_READINESS: { title: "Trải nghiệm trên điện thoại cần được kiểm tra thêm", detail: "Một tín hiệu hỗ trợ hiển thị trên thiết bị di động chưa được tìm thấy trong lần kiểm tra trang chủ." },
  WEBSITE_SECURITY: { title: "Kết nối an toàn cần được xem lại", detail: "Địa chỉ cuối trong lần kiểm tra chưa sử dụng kết nối HTTPS." },
  SEO_FOUNDATION: { title: "Nền tảng hiển thị tìm kiếm còn có thể hoàn thiện", detail: "Một số thông tin mô tả cơ bản cho công cụ tìm kiếm chưa được tìm thấy trong lần kiểm tra." },
  SOCIAL_SHARING: { title: "Thông tin khi chia sẻ liên kết có thể rõ hơn", detail: "Tiêu đề dành cho phần xem trước khi chia sẻ chưa được tìm thấy trong lần kiểm tra." },
};
const recommendationCopy: Partial<Record<LeadOpportunity["type"], { title: string; detail: string }>> = {
  CONTACT_CONVERSION: { title: "Làm rõ hành động chính", detail: "Chọn một hành động ưu tiên như gọi, nhắn Zalo hoặc gửi yêu cầu và đặt ở vị trí dễ thấy." },
  CLICK_TO_CALL: { title: "Thêm lối gọi nhanh trên điện thoại", detail: "Giúp khách đang xem trên di động có thể gọi trực tiếp mà không cần sao chép số." },
  DIRECT_BOOKING: { title: "Bắt đầu bằng luồng hỏi phòng đơn giản", detail: "Có thể dùng form hoặc nút nhắn trực tiếp trước khi cân nhắc hệ thống đặt phòng phức tạp." },
  LOCAL_CONTACT: { title: "Gom các lựa chọn liên hệ", detail: "Đặt điện thoại, Zalo và hướng dẫn liên hệ tại một khu vực rõ ràng, nhất quán." },
  MOBILE_READINESS: { title: "Kiểm tra lại trải nghiệm di động", detail: "Ưu tiên khả năng đọc nội dung và thao tác liên hệ trên màn hình nhỏ." },
  WEBSITE_SECURITY: { title: "Chuẩn hóa kết nối HTTPS", detail: "Đảm bảo khách luôn được chuyển tới phiên bản an toàn của website." },
  SEO_FOUNDATION: { title: "Hoàn thiện thông tin tìm kiếm cơ bản", detail: "Viết tiêu đề và mô tả ngắn, đúng với dịch vụ và khu vực doanh nghiệp phục vụ." },
};

function socialSnapshot(lead: SnapshotLead, generatedAt: string): PublicAuditSnapshot {
  const channels = [lead.phone && "điện thoại", (lead.facebookUrl || classifyBusinessUrl(lead.websiteUrl).platform === "Facebook") && "Facebook", lead.instagramUrl && "Instagram", lead.zaloUrl && "Zalo", lead.sourceType?.includes("google_places") && "Google Maps"].filter(Boolean) as string[];
  return publicAuditSnapshotSchema.parse({ version: 1, business: { name: lead.businessName, ...(lead.industry ? { industry: lead.industry } : {}), ...(lead.locationText ? { location: lead.locationText } : {}) }, reportType: "SOCIAL_ONLY", summary: { headline: "Bên mình đã có các kênh giúp khách tìm thấy và liên hệ. Điểm có thể bổ sung là một nơi riêng để khách xem thông tin tập trung.", intro: "Báo cáo này ghi lại một vài quan sát ban đầu về hiện diện online và hướng cải thiện vừa đủ để cùng trao đổi." }, observations: [{ title: "Đã có kênh để khách tìm thấy hoặc liên hệ", detail: channels.length ? `Các kênh ghi nhận được: ${channels.join(", ")}.` : "Doanh nghiệp đã có hiện diện online để khách bắt đầu tìm hiểu." }, { title: "Chưa phát hiện website riêng", detail: "Hiện thông tin đang nằm trên các kênh bên thứ ba; chưa phát hiện một website riêng để khách xem tập trung." }], opportunities: [{ title: "Tập trung thông tin quan trọng", detail: "Một trang riêng có thể gom dịch vụ hoặc phòng, tiện nghi, vị trí, chính sách và câu hỏi thường gặp." }, { title: "Tạo đường liên hệ trực tiếp rõ ràng", detail: "Khách vẫn có thể gọi, nhắn Zalo hoặc Facebook theo thói quen, với một điểm bắt đầu dễ hiểu hơn." }, { title: "Giữ khả năng mở rộng sau này", detail: "Khi có nhu cầu rõ, website riêng có thể hỗ trợ đo lường hoặc luồng hỏi/đặt trực tiếp." }], recommendations: [{ title: "Bắt đầu bằng landing page một trang", detail: "Chưa cần hệ thống phức tạp khi nhu cầu đặt trực tiếp chưa được xác nhận." }, { title: "Tiếp tục dùng các kênh đang hiệu quả", detail: "Website nên bổ trợ Facebook, Google Maps, Zalo và OTA thay vì thay thế các kênh này." }], cta: { title: "Bước tiếp theo nhẹ nhàng", detail: "Nếu anh/chị muốn, Sao Béo có thể dựng thử một phương án giao diện ngắn dựa trên các điểm trên để mình xem trước. Nếu thấy phù hợp mình trao đổi tiếp." }, generatedAt });
}

function websiteSnapshot(lead: SnapshotLead, scan: NonNullable<SnapshotScan>, opportunities: OpportunityResult, strategy: SalesStrategy, generatedAt: string): PublicAuditSnapshot {
  const useful = opportunities.opportunities.filter((item) => observationCopy[item.type]).slice(0, 5);
  return publicAuditSnapshotSchema.parse({ version: 1, business: { name: lead.businessName, ...(lead.industry ? { industry: lead.industry } : {}), ...(lead.locationText ? { location: lead.locationText } : {}), website: lead.websiteUrl! }, reportType: "WEBSITE_AUDIT", summary: { headline: "Website đã có nền tảng hiện diện riêng. Một vài điểm có thể được làm rõ hơn để khách liên hệ thuận tiện hơn.", intro: `Đã xem trang chủ vào ${scan.createdAt.toLocaleDateString("vi-VN")}. Nội dung dưới đây chỉ phản ánh những gì tìm thấy trong lần kiểm tra này.` }, observations: useful.map((item) => ({ ...observationCopy[item.type]!, severity: item.severity })), opportunities: useful.slice(0, 4).map((item) => ({ title: item.title.replace(/^Chưa /, "Có thể "), detail: observationCopy[item.type]!.detail })), recommendations: useful.map((item) => recommendationCopy[item.type]).filter((item): item is NonNullable<typeof item> => Boolean(item)).slice(0, 3), cta: { title: "Bước tiếp theo", detail: strategy.recommendation === "OPTIMIZE_EXISTING" ? "Nếu anh/chị muốn, Sao Béo có thể phác thảo một phương án tối ưu ngắn dựa trên các điểm trên để mình xem trước; chưa cần quyết định làm lại website." : "Nếu anh/chị muốn, mình có thể trao đổi 10–15 phút để xác định điểm nào thực sự đáng ưu tiên cho mô hình hiện tại." }, generatedAt });
}

export function buildPublicAuditSnapshot(lead: SnapshotLead, scan: SnapshotScan, opportunities: OpportunityResult, strategy: SalesStrategy, now = new Date()) {
  const classification = classifyBusinessUrl(lead.websiteUrl); const generatedAt = now.toISOString();
  if (classification.kind !== "STANDALONE_WEBSITE") return socialSnapshot(lead, generatedAt);
  if (!scan || scan.status !== "SUCCESS" || !scan.checks) throw new Error("SUCCESSFUL_AUDIT_REQUIRED");
  return websiteSnapshot(lead, scan, opportunities, strategy, generatedAt);
}
