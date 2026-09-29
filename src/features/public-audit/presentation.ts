import type { PublicAuditSnapshot } from "./types";
export type ReportIndustry="LODGING"|"RESTAURANT_CAFE"|"BEAUTY_WELLNESS"|"EDUCATION"|"CONSTRUCTION_LOCAL_SERVICE"|"GENERIC_LOCAL_BUSINESS";
type Item={title:string;detail:string};
export type HealthStatus = "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL";

export type DigitalHealthPillar = {
  key: "search_visibility" | "mobile_experience" | "info_clarity" | "direct_conversion";
  label: string;
  score: number;
  status: HealthStatus;
  statusLabel: string;
  finding: string;
  recommendation: string;
};

export type DigitalHealthScorecard = {
  overallScore: number;
  overallBand: "STRONG" | "FAIR" | "DEVELOPING";
  overallSummary: string;
  pillars: DigitalHealthPillar[];
};

export type BeforeVsAfterItem = {
  aspect: string;
  before: string;
  after: string;
  benefit: string;
};

export type CostOfInaction = {
  headline: string;
  bulletPoints: string[];
  opportunityGain: string;
};

export type ZaloConsultation = {
  brandPhone: string;
  brandName: string;
  messageText: string;
  zaloHref: string;
};

export type LodgingSegment = "HOMESTAY" | "HOTEL" | "VILLA" | "STANDARD_LODGING";

export function detectLodgingSegment(name?: string, industry?: string): LodgingSegment {
  const n = (name || "").toLowerCase();
  const ind = (industry || "").toLowerCase();

  // Priority 1: Check business name first
  if (/villa|biệt thự|nguyên căn/i.test(n)) return "VILLA";
  if (/homestay|home stay|farmstay|glamping|hostel|nhà của|nhà mây|gác mái|stay|house|căn hộ|tiệm homestay/i.test(n)) return "HOMESTAY";
  if (/hotel|khách sạn|resort|motel|nhà nghỉ|inn/i.test(n)) return "HOTEL";

  // Priority 2: Check industry category
  if (/villa|biệt thự|nguyên căn/i.test(ind)) return "VILLA";
  if (/homestay|farmstay|glamping|hostel/i.test(ind)) return "HOMESTAY";
  if (/hotel|khách sạn|resort|nhà nghỉ|motel/i.test(ind)) return "HOTEL";

  // Default fallback for lodging businesses
  return "HOMESTAY";
}

export type ReportNarrative = {
  industry: ReportIndustry;
  lodgingSegment?: LodgingSegment;
  businessContext: string;
  headline: string;
  executiveSummary: string;
  statusChips: string[];
  currentStrengths: Item[];
  customerJourney: string[];
  gaps: Item[];
  valueHypotheses: Item[];
  recommendedPlan: Array<Item & { step: string }>;
  scorecard: DigitalHealthScorecard;
  beforeVsAfter: BeforeVsAfterItem[];
  costOfInaction: CostOfInaction;
  zaloConsultation: ZaloConsultation;
  primaryCTA: string;
  secondaryCTA?: string;
};

export function classifyReportIndustry(industry?: string): ReportIndustry {
  const value = industry || "";
  if (/hotel|homestay|khách sạn|nhà nghỉ|resort|lưu trú|villa/i.test(value)) return "LODGING";
  if (/restaurant|cafe|coffee|nhà hàng|quán ăn|ẩm thực|cà phê/i.test(value)) return "RESTAURANT_CAFE";
  if (/spa|salon|beauty|thẩm mỹ|nail|wellness|chăm sóc/i.test(value)) return "BEAUTY_WELLNESS";
  if (/school|education|trường|trung tâm|giáo dục|đào tạo|ngoại ngữ/i.test(value)) return "EDUCATION";
  if (/construction|xây dựng|nội thất|sửa chữa|điện nước|kiến trúc|dịch vụ địa phương/i.test(value)) return "CONSTRUCTION_LOCAL_SERVICE";
  return "GENERIC_LOCAL_BUSINESS";
}

const valuePlaybooks: Record<ReportIndustry, Item[]> = {
  LODGING: [
    { title: "Thông tin lưu trú tập trung", detail: "Khách có thể xem loại hình lưu trú, vị trí, chính sách và cách hỏi phòng ở một nơi." },
    { title: "Hình ảnh và định vị rõ hơn", detail: "Một bố cục riêng giúp cơ sở chủ động kể câu chuyện bằng tư liệu đã được duyệt." },
    { title: "Đường hỏi phòng thuận tiện", detail: "Gọi, Zalo hoặc Inbox có thể xuất hiện đúng lúc trong hành trình tìm hiểu." },
    { title: "Nền tảng cho bước sau", detail: "Có thể bổ sung đo lường hoặc luồng hỏi phòng khi nhu cầu thực tế rõ hơn." },
  ],
  RESTAURANT_CAFE: [
    { title: "Menu và món nổi bật dễ xem", detail: "Khách có thể nắm nhanh phong cách, lựa chọn chính và thông tin cần biết." },
    { title: "Không khí thương hiệu nhất quán", detail: "Một điểm đến riêng giúp truyền tải hình ảnh và trải nghiệm theo cách chủ động." },
    { title: "Vị trí và liên hệ rõ", detail: "Bản đồ, gọi điện hoặc hỏi bàn có thể được đặt đúng lúc." },
    { title: "Dễ cập nhật chiến dịch", detail: "Tạo nền tảng cho nội dung, sự kiện và đo lường khi có thông tin xác minh." },
  ],
  BEAUTY_WELLNESS: [
    { title: "Danh mục dịch vụ rõ ràng", detail: "Khách dễ hiểu nhóm dịch vụ trước khi cần tư vấn chi tiết." },
    { title: "Hành trình đặt lịch gọn hơn", detail: "CTA gọi, nhắn hoặc đặt lịch có thể được đặt ở vị trí dễ thấy." },
    { title: "Thông tin tạo an tâm", detail: "Quy trình, đội ngũ và hình ảnh chỉ được trình bày khi đã được xác minh hoặc phê duyệt." },
    { title: "Điểm đến thương hiệu riêng", detail: "Website bổ sung cho mạng xã hội và giúp trải nghiệm nhất quán hơn." },
  ],
  EDUCATION: [
    { title: "Chương trình dễ so sánh", detail: "Phụ huynh hoặc học viên có thể nắm mục tiêu và lộ trình rõ hơn." },
    { title: "Hành trình tư vấn rõ", detail: "Các bước tìm hiểu, hỏi thông tin và đăng ký tư vấn được sắp xếp gọn." },
    { title: "Thông tin tạo tin cậy", detail: "Giáo viên, chương trình và phương pháp chỉ hiển thị từ dữ liệu đã xác minh." },
    { title: "FAQ giảm câu hỏi lặp lại", detail: "Những câu hỏi phổ biến có thể được giải thích trước khi tư vấn." },
  ],
  CONSTRUCTION_LOCAL_SERVICE: [
    { title: "Năng lực dịch vụ dễ hiểu", detail: "Phạm vi công việc và quy trình có thể được trình bày rõ ràng hơn." },
    { title: "Dự án có chọn lọc", detail: "Portfolio chỉ dùng công trình và tư liệu đã được xác minh, cho phép sử dụng." },
    { title: "Đường yêu cầu báo giá rõ", detail: "Khách dễ gọi, nhắn hoặc gửi nhu cầu ban đầu." },
    { title: "Thông tin tạo tin cậy", detail: "Quy trình, khu vực phục vụ và cam kết chỉ được nêu khi có căn cứ." },
  ],
  GENERIC_LOCAL_BUSINESS: [
    { title: "Thông tin tập trung", detail: "Khách không phải tìm nhiều nơi để hiểu dịch vụ và cách liên hệ." },
    { title: "Đường liên hệ rõ hơn", detail: "Gọi, Zalo hoặc Messenger được đặt đúng lúc trong hành trình." },
    { title: "Thương hiệu nhất quán hơn", detail: "Một điểm đến sở hữu riêng giúp doanh nghiệp trình bày hình ảnh chủ động." },
    { title: "Sẵn sàng đo lường", detail: "Có nền tảng để gắn analytics, quảng cáo và SEO khi phù hợp." },
  ],
};

function buildScorecard(report: PublicAuditSnapshot): DigitalHealthScorecard {
  const isSocial = report.reportType === "SOCIAL_ONLY";
  const obs = report.observations;

  let searchScore = isSocial ? 70 : 80;
  let mobileScore = isSocial ? 40 : 75;
  let infoScore = isSocial ? 45 : 70;
  let convScore = isSocial ? 35 : 60;

  if (!isSocial) {
    if (obs.some((o) => /seo/i.test(o.title))) searchScore -= 20;
    if (obs.some((o) => /điện thoại|mobile/i.test(o.title))) mobileScore -= 25;
    if (obs.some((o) => /thông tin|liên hệ/i.test(o.title))) infoScore -= 20;
    if (obs.some((o) => /chuyển đổi|gọi trực tiếp|đặt phòng/i.test(o.title))) convScore -= 25;
  }

  const getStatus = (score: number): HealthStatus => {
    if (score >= 80) return "EXCELLENT";
    if (score >= 60) return "GOOD";
    if (score >= 40) return "NEEDS_IMPROVEMENT";
    return "CRITICAL";
  };

  const getStatusLabel = (status: HealthStatus): string => {
    switch (status) {
      case "EXCELLENT": return "Tốt";
      case "GOOD": return "Khá";
      case "NEEDS_IMPROVEMENT": return "Cần cải thiện";
      case "CRITICAL": return "Thiếu hụt lớn";
    }
  };

  const pillars: DigitalHealthPillar[] = [
    {
      key: "search_visibility",
      label: "Tìm kiếm & Google Maps",
      score: searchScore,
      status: getStatus(searchScore),
      statusLabel: getStatusLabel(getStatus(searchScore)),
      finding: isSocial ? "Đã có vị trí Google Maps và mạng xã hội để khách tìm thấy." : "Đã có website riêng nhưng cần bổ sung mô tả và cấu trúc tìm kiếm.",
      recommendation: "Tối ưu hóa sự xuất hiện đồng bộ giữa Maps và Website chính thức.",
    },
    {
      key: "mobile_experience",
      label: "Trải nghiệm Di động (4G)",
      score: mobileScore,
      status: getStatus(mobileScore),
      statusLabel: getStatusLabel(getStatus(mobileScore)),
      finding: isSocial ? "Khách phải lướt qua nhiều bài viết mạng xã hội trên app để tìm thông tin." : "Giao diện website cần được tối ưu tốc độ và kích thước nút bấm trên màn hình điện thoại.",
      recommendation: "Ưu tiên trang di động tốc độ cao, vuốt chạm mượt mà không phải chờ đợi.",
    },
    {
      key: "info_clarity",
      label: "Minh bạch Thông tin & Giá",
      score: infoScore,
      status: getStatus(infoScore),
      statusLabel: getStatusLabel(getStatus(infoScore)),
      finding: isSocial ? "Giá phòng/dịch vụ, tiện nghi và chính sách bị phân tán nhiều bài đăng." : "Thông tin các gói dịch vụ và chính sách cần được gom gọn tại một nơi dễ thấy.",
      recommendation: "Gom đầy đủ bảng giá, hình ảnh và chính sách vào một bố cục trực quan.",
    },
    {
      key: "direct_conversion",
      label: "Chốt khách Trực tiếp (Zalo/Gọi)",
      score: convScore,
      status: getStatus(convScore),
      statusLabel: getStatusLabel(getStatus(convScore)),
      finding: isSocial ? "Chưa có đường dẫn 1 chạm để khách chọn nhu cầu và nhắn Zalo trực tiếp." : "Các nút gọi nhanh hoặc nhắn Zalo chưa được đặt nổi bật ở các vị trí quyết định.",
      recommendation: "Bổ sung nút gọi và nhắn Zalo với nội dung đã điền sẵn để khách bấm là chốt.",
    },
  ];

  const overallScore = Math.round((searchScore + mobileScore + infoScore + convScore) / 4);
  const overallBand = overallScore >= 75 ? "STRONG" : overallScore >= 50 ? "FAIR" : "DEVELOPING";
  const overallSummary = overallScore >= 75
    ? "Cơ sở đã có nền tảng tốt, cơ hội lớn nhất nằm ở việc tối ưu hóa tỷ lệ chuyển đổi trực tiếp."
    : overallScore >= 50
    ? "Cơ sở đã có điểm chạm online; bổ sung một trang chốt khách riêng sẽ giúp tăng mạnh hiệu quả tiếp cận."
    : "Cơ sở đang bỏ lỡ nhiều khách hàng tiềm năng do thiếu một điểm đến thông tin chính thức.";

  return { overallScore, overallBand, overallSummary, pillars };
}

function buildBeforeVsAfter(industry: ReportIndustry, lodgingSegment?: LodgingSegment): BeforeVsAfterItem[] {
  if (industry === "LODGING") {
    if (lodgingSegment === "HOMESTAY") {
      return [
        {
          aspect: "Khách hỏi phòng qua Facebook / Zalo",
          before: "Mỗi ngày phải gửi đi gửi lại 10-20 tấm ảnh phòng, bảng giá và trả lời các câu hỏi lặp lại; khách xem xong hay 'seen' hoặc nhắn lúc nửa đêm không ai trực.",
          after: "Gửi 1 link duy nhất: Khách mở xem trọn vẹn album ảnh thật góc rộng, giá từng phòng, view đồi và quy định homestay trong 20 giây rồi bấm Zalo chốt phòng.",
          benefit: "Tiết kiệm 80% thời gian trực page, không còn rớt khách hỏi phòng đêm muộn.",
        },
        {
          aspect: "Khách tìm kiếm trên Google Maps",
          before: "Khách du lịch tìm thấy homestay trên Maps (nhiều sao đánh giá tốt) nhưng không có link website xem phòng/giá ngay, dễ lướt qua chọn cơ sở khác.",
          after: "Link website chính thức hiển thị nổi bật trên Google Maps dẫn về trang đích riêng, khách bấm vào xem ảnh và liên hệ đặt cọc ngay.",
          benefit: "Chuyển hóa 100% lượt khách tìm kiếm tự nhiên trên Google Maps thành khách hỏi đặt phòng.",
        },
        {
          aspect: "Tự chủ kênh bán & hiệu quả quảng cáo Facebook / TikTok",
          before: "Phụ thuộc 100% vào bài đăng và chạy ads mạng xã hội bị trôi bài, chi phí quảng cáo cao nhưng khách chỉ hỏi dạo qua inbox rồi biến mất.",
          after: "Sở hữu trang đích riêng độc lập, link bio chuẩn đẹp gắn trên Fanpage/TikTok/Zalo và Maps, khách xem đủ thông tin là tự bấm chốt cọc.",
          benefit: "Tối ưu từng đồng ngân sách quảng cáo, xây dựng tệp khách quen quay lại không tốn thêm chi phí.",
        },
      ];
    }

    if (lodgingSegment === "HOTEL") {
      return [
        {
          aspect: "Tỷ lệ đặt phòng trực tiếp (Direct Booking) vs. Sàn OTA",
          before: "Phụ thuộc 70–80% vào Agoda, Booking.com; mất 15% – 22% phí hoa hồng trên từng đêm phòng và bị sàn chèn quảng cáo khách sạn đối thủ.",
          after: "Hệ thống Direct Booking chuyên nghiệp trên website riêng, có chính sách ưu đãi giảm 5–10% cho khách đặt thẳng qua hotline/Zalo.",
          benefit: "Tiết kiệm hàng chục triệu đồng tiền hoa hồng OTA mỗi tháng, làm chủ dữ liệu khách hàng.",
        },
        {
          aspect: "Phân hạng phòng & Dịch vụ chuẩn khách sạn",
          before: "Thông tin tiện ích khách sạn (thang máy, ăn sáng buffet, bãi đỗ xe ô tô, hóa đơn VAT) không được hiển thị tập trung.",
          after: "Bảng phân hạng phòng chi tiết (Standard, Deluxe, Suite), bảng giá theo mùa và chính sách đón tiễn sân bay rõ ràng.",
          benefit: "Tăng niềm tin từ khách công tác, khách gia đình và đoàn thể sẵn sàng đặt phòng trước.",
        },
        {
          aspect: "Hình ảnh thương hiệu & Khách đoàn",
          before: "Chỉ có fanpage thông thường, khó đàm phán hợp đồng giá trị lớn cho khách tour hoặc hội nghị.",
          after: "Website riêng khẳng định đẳng cấp khách sạn, có form yêu cầu báo giá đoàn nhanh chóng.",
          benefit: "Dễ dàng ký hợp đồng dịch vụ phòng và sự kiện cho các cơ quan, đoàn du lịch.",
        },
      ];
    }

    if (lodgingSegment === "VILLA") {
      return [
        {
          aspect: "Quyết định đặt cọc của khách đoàn VIP",
          before: "Khách đoàn 10–20 người đòi hỏi xem chi tiết từng phòng ngủ, bếp BBQ, chỗ đậu xe 16 chỗ... Gửi tin nhắn rời rạc khiến khách chần chừ không dám chuyển cọc tiền triệu.",
          after: "Trang đích riêng thể hiện sơ đồ toàn căn villa, video/ảnh 360 độ, chi tiết tiện ích nhóm (karaoke, bida, bếp nướng, hồ bơi). Cả đoàn cùng xem chung link và đồng thuận ngay.",
          benefit: "Tăng tốc độ chốt cọc villa từ 2–3 ngày xuống còn 15 phút.",
        },
        {
          aspect: "Tránh trùng lịch (Overbooking) & quản lý nguyên căn",
          before: "Khách hỏi dồn nhiều kênh cùng lúc dễ gây nhầm lẫn lịch trống căn villa.",
          after: "Trang đặt lịch trực tiếp 1-chạm qua Zalo quản lý, xác nhận giữ căn độc quyền.",
          benefit: "Quản lý doanh thu nguyên căn chuyên nghiệp, giảm thiểu rủi ro hủy phòng phút chót.",
        },
        {
          aspect: "Khẳng định đẳng cấp nghỉ dưỡng biệt lập",
          before: "Hình ảnh villa bị trộn lẫn trên mạng xã hội, chưa toát lên giá trị cao cấp tương xứng giá phòng.",
          after: "Trang điểm đến riêng sang trọng, tôn vinh tính riêng tư và view đồi độc bản.",
          benefit: "Tự tin định giá phòng cao hơn 15% – 20% so với mặt bằng chung.",
        },
      ];
    }

    return [
      {
        aspect: "Hành trình xem phòng & giá",
        before: "Khách phải lướt Facebook tìm bài cũ hoặc nhắn tin hỏi lặp đi lặp lại: 'Ngày này còn phòng không, giá bao nhiêu?'",
        after: "Khách mở trang 1 chạm xem trọn vẹn ảnh thật, bảng giá từng loại phòng, tiện nghi và chính sách chỉ trong 20 giây.",
        benefit: "Giảm 70% thời gian trả lời tin nhắn lặp lại của nhân viên trực page.",
      },
      {
        aspect: "Kênh chốt phòng",
        before: "Phụ thuộc vào các sàn trung gian (Booking, Agoda) mất 15% – 20% phí hoa hồng mỗi đơn, hoặc khách hỏi xong trôi tin nhắn.",
        after: "Khách chọn ngày dự kiến và bấm thẳng nút 'Hỏi phòng qua Zalo' với thông tin đã điền sẵn.",
        benefit: "Giữ trọn 100% doanh thu đặt phòng trực tiếp, không chia sẻ hoa hồng.",
      },
      {
        aspect: "Tìm kiếm tên cơ sở trên Google",
        before: "Khách tìm tên cơ sở nhưng chỉ ra trang trung gian hoặc cơ sở đối thủ cạnh tranh.",
        after: "Website chính thức của cơ sở xuất hiện uy tín, khẳng định thương hiệu riêng.",
        benefit: "Tạo sự an tâm tuyệt đối cho khách du lịch từ tỉnh xa đặt cọc.",
      },
    ];
  }

  if (industry === "RESTAURANT_CAFE") {
    return [
      {
        aspect: "Xem menu & không gian quán",
        before: "Menu chụp bằng ảnh điện thoại mờ, khó đọc giá trên màn hình nhỏ hoặc bị trôi trong album ảnh.",
        after: "Menu điện tử phân nhóm rõ ràng (Cà phê, Trà, Món ăn), gắn tag Best-Seller trực quan.",
        benefit: "Khách dễ dàng đưa ra quyết định ghé quán và chuẩn bị trước món muốn thử.",
      },
      {
        aspect: "Đặt bàn & hỏi đường",
        before: "Khách phải tìm số điện thoại trong phần giới thiệu để gọi hoặc tự tìm đường đi.",
        after: "Nút bấm 'Chỉ đường Google Maps' và 'Đặt bàn qua Zalo' nổi bật ở ngay đầu trang.",
        benefit: "Tối đa lượng khách vãng lai và nhóm gia đình đi du lịch ghé quán.",
      },
      {
        aspect: "Định vị thương hiệu địa phương",
        before: "Chỉ có fanpage thông thường giống hàng trăm quán khác trong khu vực.",
        after: "Một trang điểm đến mang đậm chất riêng và không khí đặc trưng của quán.",
        benefit: "Khách dễ dàng chia sẻ liên kết cho bạn bè và hội nhóm du lịch.",
      },
    ];
  }

  return [
    {
      aspect: "Khách tìm hiểu dịch vụ",
      before: "Thông tin dịch vụ, năng lực và bảng giá nằm rải rác nhiều nơi, khó nắm bắt.",
      after: "Mọi thông tin cốt lõi, quy trình làm việc và cam kết được trình bày gọn gàng, minh bạch.",
      benefit: "Tăng niềm tin ban đầu của khách hàng trước khi gọi tư vấn.",
    },
    {
      aspect: "Kênh liên hệ tư vấn",
      before: "Khách phải copy số điện thoại hoặc gửi tin nhắn chờ đợi phản hồi.",
      after: "Nút gọi hotline và nhắn Zalo trực tiếp 1 chạm ngay trên màn hình di động.",
      benefit: "Khách có nhu cầu kết nối ngay với chủ cơ sở trong lúc họ đang quan tâm nhất.",
    },
    {
      aspect: "Tính chuyên nghiệp thương hiệu",
      before: "Chưa có địa chỉ website riêng, thiếu điểm tựa uy tín khi khách so sánh với đối thủ.",
      after: "Website riêng khẳng định quy mô, sự tận tâm và cam kết lâu dài của doanh nghiệp.",
      benefit: "Dễ dàng chốt hợp đồng và đàm phán giá trị dịch vụ cao hơn.",
    },
  ];
}

function buildCostOfInaction(industry: ReportIndustry, lodgingSegment?: LodgingSegment): CostOfInaction {
  if (industry === "LODGING") {
    if (lodgingSegment === "HOMESTAY") {
      return {
        headline: "Bài toán thất thoát khách inbox Facebook & lãng phí thời gian trực chat",
        bulletPoints: [
          "Mất từ 1.5 – 2 tiếng mỗi ngày để gửi đi gửi lại ảnh phòng, bảng giá và trả lời các câu hỏi lặp đi lặp lại trong inbox Facebook/Zalo.",
          "Khách hỏi giá xong thường im lặng ('seen') hoặc rời đi chốt nơi khác vì phải đợi phản hồi quá lâu khi chủ cơ sở bận việc.",
          "Khách du lịch tìm thấy homestay trên Google Maps nhưng không thấy bảng giá minh bạch ngay lập tức, dẫn đến việc họ lướt qua chọn cơ sở khác gần đó.",
          "Tốn kém chi phí chạy quảng cáo Facebook/TikTok nhưng tỷ lệ chuyển đổi thành đơn cọc thấp do thiếu một trang đích đẹp mắt để giữ chân cảm xúc khách hàng.",
        ],
        opportunityGain: "Chỉ cần 1 trang đích gọn nhẹ gom đủ ảnh thật 360°, bảng giá minh bạch và vị trí: Bạn tiết kiệm 80% thời gian trả lời tin nhắn, và biến khách hỏi thành lượt chuyển cọc Zalo ngay trong 30 giây.",
      };
    }

    if (lodgingSegment === "HOTEL") {
      return {
        headline: "Bài toán cắt giảm 15% – 22% hoa hồng sàn OTA & phát triển kênh Direct Booking",
        bulletPoints: [
          "Khách sạn quy mô từ 10–20 phòng phải chi trả từ 15 đến 30 triệu đồng hoa hồng mỗi tháng cho Booking.com và Agoda.",
          "Khách quen năm sau quay lại vẫn đặt qua sàn OTA, khiến cơ sở liên tục mất phí trung gian cho chính khách hàng cũ của mình.",
          "Khi khách tìm hiểu trên app OTA, sàn luôn chủ động hiển thị các khách sạn đối thủ giảm giá ngay bên dưới để kéo khách đi.",
        ],
        opportunityGain: "Chỉ cần chuyển đổi 20% – 30% lượng khách từ sàn sang đặt trực tiếp qua website riêng, khách sạn đã tiết kiệm hàng chục triệu đồng tiền hoa hồng mỗi tháng.",
      };
    }

    if (lodgingSegment === "VILLA") {
      return {
        headline: "Bài toán tối ưu tỷ lệ chốt cọc khách đoàn & giữ trọn giá trị deal lớn",
        bulletPoints: [
          "Các deal villa nguyên căn có giá trị từ 3 – 10 triệu/đêm nhưng khách đoàn thường chần chừ chuyển cọc vì không xem được tổng thể không gian căn.",
          "Gửi thông tin rời rạc qua tin nhắn khiến người đại diện đoàn khó chia sẻ và thuyết phục các thành viên còn lại trong nhóm.",
          "Mất khách đoàn tiềm năng vào tay các căn villa có website/profile chuyên nghiệp thể hiện rõ tiện ích tiệc BBQ, karaoke và sân vườn.",
        ],
        opportunityGain: "Một trang villa sang trọng giúp cả đoàn xem chung và chốt cọc nhanh chóng, tăng tỷ lệ lấp đầy ngày cuối tuần và các dịp lễ cao điểm.",
      };
    }

    return {
      headline: "Bài toán chi phí cơ hội & doanh thu thất thoát",
      bulletPoints: [
        "Mỗi tháng cơ sở phải trả 15% – 20% phí hoa hồng cho các sàn OTA (nếu có 10 phòng đặt qua sàn, cơ sở mất 3–5 triệu hoa hồng mỗi tháng).",
        "Mất khách tiềm năng vào buổi tối hoặc giờ cao điểm do phản hồi inbox chậm trễ khi khách đang phân vân giữa nhiều nơi.",
        "Mất thời gian quý báu của người quản lý khi phải trả lời lặp đi lặp lại những câu hỏi cơ bản về giá và vị trí.",
      ],
      opportunityGain: "Chỉ cần 5–10 lượt đặt phòng trực tiếp mỗi tháng qua website riêng, cơ sở đã tiết kiệm trọn vẹn chi phí hoa hồng và tự chủ hoàn toàn tệp khách hàng của mình.",
    };
  }

  return {
    headline: "Giá trị kinh tế khi có điểm chạm chuyển đổi riêng",
    bulletPoints: [
      "Khách hàng tìm kiếm dịch vụ nhưng không thấy thông tin rõ ràng sẽ lập tức chuyển sang đối thủ có website hoàn chỉnh.",
      "Tốn kém chi phí quảng cáo mạng xã hội nhưng tỷ lệ chốt thấp do thiếu một trang đích đáng tin cậy để giải tỏa thắc mắc.",
      "Thất thoát dữ liệu khách hàng tiềm năng khi phụ thuộc 100% vào thuật toán phân phối của các nền tảng mạng xã hội.",
    ],
    opportunityGain: "Một website gọn gàng hoạt động 24/7 như một nhân viên tư vấn mẫn cán, giải đáp thắc mắc và dẫn khách về số Zalo của bạn không ngừng nghỉ.",
  };
}

export function buildReportNarrative(report: PublicAuditSnapshot): ReportNarrative {
  const category = classifyReportIndustry(report.business.industry);
  const lodgingSegment = category === "LODGING" ? detectLodgingSegment(report.business.name, report.business.industry) : undefined;
  const social = report.reportType === "SOCIAL_ONLY";
  const industryLabel = report.business.industry || "doanh nghiệp địa phương";
  const location = report.business.location ? ` tại ${report.business.location}` : "";

  const strengths: Item[] = social
    ? [
        { title: "Đã có hiện diện để khách bắt đầu tìm hiểu", detail: `${report.business.name} đã có các kênh online hỗ trợ khách tìm thấy hoặc liên hệ.` },
        { title: "Giữ được cách liên hệ quen thuộc", detail: "Facebook, Maps, điện thoại hoặc các kênh hiện tại vẫn tiếp tục đóng vai trò quan trọng." },
      ]
    : [
        { title: "Đã có một điểm đến sở hữu riêng", detail: `${report.business.name} đã có website để chủ động trình bày thông tin.` },
        { title: "Có nền tảng để tối ưu theo từng bước", detail: "Có thể tập trung vào thứ tự nội dung và CTA mà chưa cần mặc định xây lại toàn bộ." },
      ];

  const gaps = report.observations.filter((_, i) => (social ? i > 0 : true)).slice(0, 3).map((x) => ({ title: x.title, detail: x.detail }));
  if (!gaps.length) {
    gaps.push({ title: "Cần xác định ưu tiên thực tế", detail: "Nên trao đổi thêm về hành trình khách hàng trước khi chọn hạng mục triển khai." });
  }

  const journey = social
    ? ["Google / mạng xã hội", "Khách bắt đầu tìm hiểu", "Website / landing page", "Xem thông tin phù hợp", "Gọi / Zalo / Inbox"]
    : ["Google / quảng cáo / social", "Website hiện tại", "Thông tin và CTA rõ hơn", "Khách hiểu bước tiếp theo", "Liên hệ / hỏi dịch vụ"];

  const plan = (report.recommendations.length ? report.recommendations : [{ title: social ? "Bắt đầu bằng một trang gọn" : "Tối ưu một phần ưu tiên", detail: "Thử một phương án vừa đủ trước khi mở rộng." }])
    .slice(0, 4)
    .map((x, i) => ({ ...x, step: String(i + 1).padStart(2, "0") }));

  const scorecard = buildScorecard(report);
  const beforeVsAfter = buildBeforeVsAfter(category, lodgingSegment);
  const costOfInaction = buildCostOfInaction(category, lodgingSegment);

  const brandPhone = process.env.PUBLIC_CONTACT_TEXT || "0900000000";
  const messageText = `Chào 3DUA Media, mình vừa xem bản thẩm định marketing & hiện diện số của ${report.business.name}. Mình muốn trao đổi thêm về kế hoạch marketing toàn diện và phương án tăng trưởng cho cơ sở.`;
  const zaloHref = `https://zalo.me/${brandPhone.replace(/[^+\d]/g, "")}?text=${encodeURIComponent(messageText)}`;

  return {
    industry: category,
    lodgingSegment,
    businessContext: `${report.business.name} là ${industryLabel}${location}. Báo cáo này do 3DUA Media thực hiện nhằm thẩm định hiện diện số và đề xuất giải pháp marketing toàn diện tăng trưởng doanh thu thực chiến.`,
    headline: social
      ? `${report.business.name} đã có điểm chạm online; cơ hội nằm ở việc kết nối chúng thành một hành trình rõ hơn.`
      : `${report.business.name} đã có website; cơ hội nằm ở việc giúp khách hiểu và hành động thuận tiện hơn.`,
    executiveSummary: social
      ? "Website không thay thế các kênh đang hoạt động. Nếu phù hợp với mục tiêu hiện tại, một trang riêng có thể đóng vai trò trung tâm thông tin và dẫn khách về kênh liên hệ quen thuộc."
      : "Hướng phù hợp là tối ưu có chọn lọc dựa trên hành trình khách hàng, thay vì mặc định thay mới toàn bộ website.",
    statusChips: social ? ["Có hiện diện online", "Giữ kênh hiện có", "Chưa phát hiện website riêng"] : ["Đã có website riêng", "Ưu tiên tối ưu", "Dựa trên audit trang chủ"],
    currentStrengths: strengths,
    customerJourney: journey,
    gaps,
    valueHypotheses: valuePlaybooks[category],
    recommendedPlan: plan,
    scorecard,
    beforeVsAfter,
    costOfInaction,
    zaloConsultation: {
      brandPhone,
      brandName: process.env.PUBLIC_BRAND_NAME || "3DUA Media",
      messageText,
      zaloHref,
    },
    primaryCTA: social ? `Xem kế hoạch marketing & giao diện demo cho ${report.business.name}` : "Xem phương án tối ưu marketing & chuyển đổi số",
    secondaryCTA: "Kết nối chuyên viên 3DUA Media qua Zalo",
  };
}

export const buildReportPresentation = buildReportNarrative;

