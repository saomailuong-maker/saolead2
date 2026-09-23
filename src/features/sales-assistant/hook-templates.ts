export type HookTemplateId = "HOMESTAY_DIRECT" | "HOTEL_MAPS" | "SHORT_3LINES" | "LOCAL_SERVICE";

export interface HookTemplate {
  id: HookTemplateId;
  name: string;
  badge: string;
  description: string;
  build: (params: { businessName: string; industry?: string | null; location?: string | null }) => string;
}

export const HOOK_TEMPLATES: Record<HookTemplateId, HookTemplate> = {
  SHORT_3LINES: {
    id: "SHORT_3LINES",
    name: "Siêu ngắn (3 dòng - Dễ rep nhất)",
    badge: "⚡ Tỷ lệ rep cao",
    description: "Ngắn gọn, bình dân, hỏi thăm mở đầu không quăng link để khách rep trước",
    build: ({ businessName }) =>
      `Dạ em chào anh/chị ${businessName}, em thấy bên mình làm hình ảnh rất có gu và view đẹp.

Bên em đang hỗ trợ các cơ sở lưu trú tối ưu kênh online chốt phòng trực tiếp qua Zalo và đẩy từ khóa Google Maps.

Nếu anh/chị quan tâm tối ưu thêm khách du lịch, em gửi anh/chị xem qua nhé!`,
  },

  HOMESTAY_DIRECT: {
    id: "HOMESTAY_DIRECT",
    name: "Homestay (Tránh mất khách Maps & Phí OTA)",
    badge: "🏡 Homestay",
    description: "Đánh trúng nỗi đau trôi tin nhắn inbox và mất 15-20% phí hoa hồng sàn",
    build: ({ businessName }) =>
      `Em chào anh/chị ${businessName}, em thấy homestay nhà mình trên Google Maps làm hình ảnh và đánh giá phòng rất tốt.

Tuy nhiên bên mình chưa gắn link xem bảng giá & đặt phòng trực tiếp nên khách tìm thấy trên Maps dễ bị trôi sang bên khác hoặc phải đặt qua sàn mất phí hoa hồng 15-20%.

Bên em có giải pháp hỗ trợ cơ sở làm trang đặt phòng 1-chạm qua Zalo và tối ưu SEO Maps kéo khách, không biết bên mình có quan tâm kênh này không ạ?`,
  },

  HOTEL_MAPS: {
    id: "HOTEL_MAPS",
    name: "Khách sạn (SEO Top Google Maps & Direct Booking)",
    badge: "🏨 Khách sạn / Hotel",
    description: "Tập trung vào vị trí tìm kiếm Google Maps và giữ lại 100% doanh thu phòng",
    build: ({ businessName, location }) =>
      `Em chào anh/chị ${businessName}, em thấy khách sạn mình đang đón khách tại ${location || "khu vực"} rất đều.

Bên em chuyên hỗ trợ các khách sạn tại địa phương tối ưu vị trí hiển thị Top 3 Google Maps khi khách tìm phòng và làm trang đặt phòng trực tiếp để giữ lại 100% doanh thu không qua trung gian.

Nếu tiện em gửi anh/chị tham khảo thử phương án bên em đã làm cho các bên tương tự nhé!`,
  },

  LOCAL_SERVICE: {
    id: "LOCAL_SERVICE",
    name: "Dịch vụ địa phương / F&B",
    badge: "🍽️ Dịch vụ / Nhà hàng",
    description: "Dành cho quán cafe, nhà hàng, điểm tham quan, dịch vụ du lịch",
    build: ({ businessName }) =>
      `Em chào anh/chị ${businessName}, em thấy bên mình được nhiều khách du lịch ghé thăm và review tốt trên Google Maps.

Bên em đang có gói hỗ trợ cơ sở tối ưu tìm kiếm địa phương (Local SEO Google) và trang thực đơn/dịch vụ 1-chạm gửi nhanh cho khách qua Zalo.

Nếu tiện em gửi anh/chị xem phương án ngắn gọn nhé!`,
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
