export type HookTemplateId = "COMPREHENSIVE_MARKETING" | "HOMESTAY_DIRECT" | "HOTEL_MAPS" | "SHORT_3LINES" | "LOCAL_SERVICE";

export interface HookTemplate {
  id: HookTemplateId;
  name: string;
  badge: string;
  description: string;
  build: (params: { businessName: string; industry?: string | null; location?: string | null }) => string;
}

export const HOOK_TEMPLATES: Record<HookTemplateId, HookTemplate> = {
  COMPREHENSIVE_MARKETING: {
    id: "COMPREHENSIVE_MARKETING",
    name: "Marketing Toàn Diện (3DUA Media Trọn gói)",
    badge: "🚀 Toàn diện 3DUA",
    description: "Giải pháp trọn gói: Sản xuất Media/Reels + Quảng cáo đa nền tảng + Local SEO Maps + Kênh chốt khách Zalo",
    build: ({ businessName, location }) =>
      `Dạ em chào anh/chị ${businessName}, em bên 3DUA Media - chuyên giải pháp Marketing toàn diện cho các cơ sở tại ${location || "khu vực"}.

Em thấy cơ sở mình có tiềm năng rất lớn nhưng hiện diện số đa kênh chưa được tối ưu đồng bộ (từ hình ảnh/video ngắn hút khách, vị trí tìm kiếm trên Google Maps, đến kênh chốt khách trực tiếp qua Zalo).

Bên em đang hỗ trợ trọn gói từ sản xuất hình ảnh/video review cuốn hút, tối ưu Google Maps đón khách du lịch, chạy quảng cáo thực chiến đến hệ thống chốt khách trực tiếp giữ 100% doanh thu.

Nếu anh/chị quan tâm, tham khảo thử kế hoạch marketing tổng thể bên em nhé!`,
  },

  SHORT_3LINES: {
    id: "SHORT_3LINES",
    name: "Siêu ngắn (3 dòng - Dễ rep nhất)",
    badge: "⚡ Tỷ lệ rep cao",
    description: "Ngắn gọn, bình dân, hỏi thăm mở đầu không quăng link để khách rep trước",
    build: ({ businessName }) =>
      `Dạ em chào anh/chị ${businessName}, em thấy bên mình làm hình ảnh rất có gu và view đẹp.

Bên em (3DUA Media) đang cung cấp giải pháp marketing toàn diện: sản xuất media cuốn hút, tối ưu vị trí hiển thị khi khách tìm kiếm trên Google và hệ thống chốt khách trực tiếp qua Zalo.

Nếu anh/chị quan tâm, tham khảo thử phương án bên em nhé!`,
  },

  HOMESTAY_DIRECT: {
    id: "HOMESTAY_DIRECT",
    name: "Homestay (Marketing Trọn Gói & Tránh Phí OTA)",
    badge: "🏡 Homestay",
    description: "Đánh trúng nỗi đau trôi tin nhắn inbox và mất 15-20% phí hoa hồng sàn",
    build: ({ businessName }) =>
      `Em chào anh/chị ${businessName}, em thấy homestay nhà mình trên Google Maps làm hình ảnh và đánh giá phòng rất tốt.

Tuy nhiên bên mình chưa gắn link xem bảng giá & đặt phòng trực tiếp nên khách tìm thấy trên Maps dễ bị trôi sang bên khác hoặc phải đặt qua sàn mất phí hoa hồng 15-20%.

Bên em (3DUA Media) cung cấp giải pháp marketing toàn diện cho homestay: từ sản xuất hình ảnh/video Reels view đẹp, tối ưu vị trí hiển thị khi khách tìm kiếm trên Google, đến trang đặt phòng trực tiếp (landing page) chốt cọc nhanh qua Zalo để giữ lại 100% doanh thu.

Nếu anh/chị quan tâm, tham khảo thử phương án bên em nhé!`,
  },

  HOTEL_MAPS: {
    id: "HOTEL_MAPS",
    name: "Khách sạn (Marketing Số & Direct Booking)",
    badge: "🏨 Khách sạn / Hotel",
    description: "Tập trung vào tối ưu vị trí hiển thị khi khách tìm kiếm trên Google và giữ lại 100% doanh thu phòng",
    build: ({ businessName, location }) =>
      `Em chào anh/chị ${businessName}, em thấy khách sạn mình đang đón khách tại ${location || "khu vực"} rất đều.

Bên em (3DUA Media) cung cấp giải pháp marketing số toàn diện cho khách sạn: tối ưu vị trí hiển thị khi khách tìm kiếm trên Google để tìm phòng, triển khai quảng cáo đa kênh đón đầu mùa du lịch, và làm trang đặt phòng trực tiếp (landing page) hoặc trang web để giữ lại 100% doanh thu không qua trung gian.

Nếu anh/chị quan tâm, tham khảo thử phương án bên em nhé!`,
  },

  LOCAL_SERVICE: {
    id: "LOCAL_SERVICE",
    name: "Dịch vụ địa phương / F&B (Marketing Thực Chiến)",
    badge: "🍽️ Dịch vụ / Nhà hàng",
    description: "Dành cho quán cafe, nhà hàng, điểm tham quan, dịch vụ du lịch",
    build: ({ businessName }) =>
      `Em chào anh/chị ${businessName}, em thấy bên mình được nhiều khách du lịch ghé thăm và review tốt trên Google Maps.

Bên em (3DUA Media) cung cấp giải pháp marketing thực chiến cho cơ sở ẩm thực & dịch vụ: sản xuất video review/Reels viral, tối ưu vị trí hiển thị khi khách tìm kiếm trên Google, và làm trang giới thiệu dịch vụ/thực đơn (landing page) gửi nhanh cho khách qua Zalo để bứt phá lượng khách ghé quán.

Nếu anh/chị quan tâm, tham khảo thử phương án bên em nhé!`,
  },
};

export function getDefaultHookTemplate(industry?: string | null): HookTemplateId {
  const ind = (industry || "").toLowerCase();
  if (ind.includes("homestay") || ind.includes("villa") || ind.includes("nhà nghỉ")) {
    return "HOMESTAY_DIRECT";
  }
  if (ind.includes("hotel") || ind.includes("khách sạn") || ind.includes("resort")) {
    return "HOTEL_MAPS";
  }
  if (ind.includes("cafe") || ind.includes("nhà hàng") || ind.includes("ăn uống") || ind.includes("ẩm thực")) {
    return "LOCAL_SERVICE";
  }
  return "SHORT_3LINES";
}
