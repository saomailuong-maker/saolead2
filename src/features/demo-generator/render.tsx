"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { DemoBrief, DemoContent, DemoPreset } from "./types";
import { detectLodgingSegment } from "../public-audit/presentation";

const themes: Record<DemoPreset, { page: string; hero: string; accent: string; soft: string; card: string; border: string }> = {
  WARM_HOSPITALITY: {
    page: "bg-[#fdfaf5] text-[#2c1e16]",
    hero: "bg-[#241711] text-white",
    accent: "bg-[#c87a38] text-white hover:bg-[#b56b2e]",
    soft: "bg-[#faeee2] text-[#82471d]",
    card: "bg-white border-[#f0e2d3]",
    border: "border-[#eddccb]",
  },
  PREMIUM_DARK: {
    page: "bg-[#0c1017] text-slate-100",
    hero: "bg-[#07090e] text-white",
    accent: "bg-[#dfb46c] text-[#1a140a] hover:bg-[#cfa45a]",
    soft: "bg-[#251e15] text-[#ecd19f]",
    card: "bg-[#141b24] border-slate-800",
    border: "border-slate-800",
  },
  MODERN_MINIMAL: {
    page: "bg-[#f8fafc] text-[#0f172a]",
    hero: "bg-[#0f2942] text-white",
    accent: "bg-[#d97736] text-white hover:bg-[#c56828]",
    soft: "bg-[#e2edf8] text-[#133c63]",
    card: "bg-white border-slate-200",
    border: "border-slate-200",
  },
  LOCAL_FRIENDLY: {
    page: "bg-[#f4f8f5] text-[#153427]",
    hero: "bg-[#143d30] text-white",
    accent: "bg-[#e07a3c] text-white hover:bg-[#cc6c30]",
    soft: "bg-[#d8ecdf] text-[#164b39]",
    card: "bg-white border-[#cfe2d5]",
    border: "border-[#cfe2d5]",
  },
};

const labels: Record<string, string> = {
  value: "Thông tin nổi bật",
  services: "Không gian, dịch vụ và trải nghiệm",
  gallery: "Góc ảnh không gian thực tế",
  contact: "Vị trí và cách liên hệ",
  trust: "Vì sao khách dễ an tâm hơn",
  faq: "Câu hỏi thường gặp",
  issue: "Điểm có thể làm rõ",
  details: "Thông tin cần biết",
  dates: "Chọn nhu cầu và thời gian",
};

export function ctaHref(brief: DemoBrief) {
  if (brief.primaryCTA.target === "PHONE" && brief.brand.phone) {
    return `tel:${brief.brand.phone.replace(/[^+\d]/g, "")}`;
  }
  return "#booking-widget";
}

interface RoomOption {
  id: string;
  name: string;
  pricePerNight: number;
  standardPrice: number;
  image: string;
  capacity: string;
  bed: string;
  view: string;
  features: string[];
  perkBadge: string;
}

const homestayRooms: RoomOption[] = [
  {
    id: "attic_sunset",
    name: "Phòng Áp Mái Hoàng Hôn (Sunset Attic)",
    pricePerNight: 550000,
    standardPrice: 650000,
    image: "/images/demo/homestay_room.jpg",
    capacity: "2 người lớn",
    bed: "1 Giường Queen êm ái",
    view: "Trọn đồi thông & sương mù thung lũng",
    features: ["Bồn tắm ngắm cảnh", "Máy sưởi ấm mùa đông", "Ban công ngắm mây", "Smart TV & Loa Bluetooth"],
    perkBadge: "Tặng 1 buổi cafe sáng & hỗ trợ thuê xe máy",
  },
  {
    id: "pine_balcony",
    name: "Phòng Ban Công View Đồi Thông (Pine Balcony)",
    pricePerNight: 650000,
    standardPrice: 750000,
    image: "/images/demo/homestay_hero.jpg",
    capacity: "2 người lớn",
    bed: "1 Giường Queen lớn",
    view: "Hướng vườn hoa cẩm tú cầu & rừng thông",
    features: ["Ban công uống trà view rộng", "Bình đun siêu tốc & trà thảo mộc", "Cửa sổ kính lớn đón nắng", "Máy sấy & nước nóng 24/7"],
    perkBadge: "Miễn phí bếp nướng than BBQ sân vườn",
  },
  {
    id: "garden_family",
    name: "Phòng Gia Đình Sân Vườn (Garden Suite)",
    pricePerNight: 950000,
    standardPrice: 1150000,
    image: "/images/demo/homestay_campfire.jpg",
    capacity: "4 - 5 người",
    bed: "2 Giường King lớn",
    view: "Sân vườn hoa & khu lửa trại",
    features: ["Sân BBQ riêng tư", "Không gian uống trà ấm cúng", "Bàn ăn ngoài trời", "Bếp nướng & than củi sẵn sàng"],
    perkBadge: "Tặng củi đốt lửa trại ban đêm",
  },
];

const hotelRooms: RoomOption[] = [
  {
    id: "superior_city",
    name: "Phòng Superior Tiêu Chuẩn (Superior City View)",
    pricePerNight: 750000,
    standardPrice: 920000,
    image: "/images/demo/homestay_room.jpg",
    capacity: "2 người lớn",
    bed: "1 Giường King hoặc 2 Giường Đơn",
    view: "Hướng phố trung tâm Đà Lạt",
    features: ["Ăn sáng buffet phong phú", "Thang máy & lễ tân 24/7", "Bàn làm việc & WiFi 5G tốc độ cao", "Hỗ trợ xuất hóa đơn VAT"],
    perkBadge: "Tiết kiệm 170.000đ so với sàn OTA",
  },
  {
    id: "deluxe_valley",
    name: "Phòng Deluxe Hướng Đồi (Deluxe Valley View)",
    pricePerNight: 1150000,
    standardPrice: 1400000,
    image: "/images/demo/homestay_hero.jpg",
    capacity: "2 người lớn, 1 trẻ em",
    bed: "1 Giường King lớn",
    view: "Toàn cảnh thung lũng đồi thông",
    features: ["Bồn tắm nằm cao cấp", "Ban công panorama thoáng đãng", "Minibar & máy pha cafe", "Ưu đãi xe đưa đón sân bay"],
    perkBadge: "Tiết kiệm 250.000đ so với sàn OTA",
  },
  {
    id: "executive_suite",
    name: "Phòng Executive Suite Sang Trọng",
    pricePerNight: 1850000,
    standardPrice: 2250000,
    image: "/images/demo/homestay_campfire.jpg",
    capacity: "2 - 4 người",
    bed: "Phòng khách riêng + 1 Giường Master",
    view: "Tầng cao nhất view 360 độ",
    features: ["Phòng tiếp khách riêng biệt", "Bồn sục massage Jacuzzi", "Buffet sáng phục vụ tận phòng", "Chỗ đậu ô tô VIP"],
    perkBadge: "Tiết kiệm 400.000đ so với sàn OTA",
  },
];

const villaRooms: RoomOption[] = [
  {
    id: "villa_3bed",
    name: "Thuê Trọn Căn 3 Phòng Ngủ (Nhóm 6 - 10 khách)",
    pricePerNight: 3200000,
    standardPrice: 3850000,
    image: "/images/demo/homestay_hero.jpg",
    capacity: "6 - 10 người",
    bed: "3 Phòng ngủ riêng biệt + 3 WC",
    view: "Biệt lập giữa rừng thông riêng tư",
    features: ["Sân cỏ tiệc nướng BBQ", "Bếp nấu gia đình đầy đủ gia vị", "Bàn bida giải trí", "Chỗ đỗ 2 xe ô tô 7 chỗ"],
    perkBadge: "Tặng trọn gói than BBQ & gia vị ướp nướng",
  },
  {
    id: "villa_5bed",
    name: "Thuê Trọn Căn 5 Phòng Ngủ (Đoàn 12 - 18 khách)",
    pricePerNight: 5500000,
    standardPrice: 6600000,
    image: "/images/demo/homestay_campfire.jpg",
    capacity: "12 - 18 người",
    bed: "5 Phòng ngủ riêng + 6 WC",
    view: "Toàn cảnh thung lũng săn mây",
    features: ["Phòng Karaoke gia đình âm thanh chuẩn", "Lò sưởi củi thông ấm cúng", "Sân BBQ tiệc ngoài trời", "Bãi đỗ xe 16-29 chỗ"],
    perkBadge: "Miễn phí phòng Karaoke & Bàn bida không giới hạn",
  },
  {
    id: "villa_vip_bbq",
    name: "Gói Villa VIP + Setup Tiệc Nướng BBQ Sân Vườn",
    pricePerNight: 6800000,
    standardPrice: 8200000,
    image: "/images/demo/homestay_room.jpg",
    capacity: "10 - 16 người",
    bed: "Nguyên căn biệt thự cao cấp",
    view: "View hoàng hôn thung lũng độc bản",
    features: ["Bao gồm than nướng & người hỗ trợ nhóm lửa", "Hồ ngâm nước ấm ngoài trời", "Không gian tiệc rượu vang", "Bảo vệ riêng 24/7"],
    perkBadge: "Setup sẵn bàn tiệc BBQ + Nhân viên hỗ trợ nướng",
  },
];

interface SegmentReview {
  quote: string;
  author: string;
  from: string;
}

const homestayReviews: SegmentReview[] = [
  {
    quote: "Phòng áp mái view đồi thông siêu lãng mạn! Buổi sáng thức dậy kéo rèm ra là thấy sương mù giăng kín thung lũng. Chủ homestay thân thiện, hỗ trợ thuê xe máy và chỉ chỗ ăn ngon nhiệt tình. Nhất định sẽ ghé lại!",
    author: "Minh Trang",
    from: "Du khách từ Hà Nội",
  },
  {
    quote: "Không gian mộc mạc và yên tĩnh tuyệt đối. Buổi tối đốt lửa trại nướng BBQ ngoài sân ngắm thung lũng đèn lồng cực kỳ chill. Nhắn tin hỏi phòng được gửi ngay link xem ảnh 360 độ và vị trí nên cọc rất an tâm.",
    author: "Hoàng Long & Bạn bè",
    from: "Du khách từ TP. Hồ Chí Minh",
  },
  {
    quote: "Đặt phòng trực tiếp qua link Zalo nhanh gọn lẹ, được tặng kèm bữa sáng nóng hổi và bình trà atiso thơm lừng. Phòng ốc sạch sẽ, nệm êm, nước nóng bật cái là có ngay.",
    author: "Phương Anh & Nhóm bạn",
    from: "Du khách từ Đà Nẵng",
  },
];

const hotelReviews: SegmentReview[] = [
  {
    quote: "Khách sạn nằm ngay vị trí trung tâm, đi dạo ra chợ hay hồ đều thuận tiện. Bãi đậu xe ô tô rộng rãi, có bảo vệ trông 24/7 rất an tâm.",
    author: "Anh Đức Trọng",
    from: "Khách công tác từ Hà Nội",
  },
  {
    quote: "Đặt phòng trực tiếp qua website nhận phòng nhanh chóng, giá ưu đãi tốt hơn so với đặt qua các sàn OTA. Bữa sáng buffet phong phú, đồ ăn nóng sốt và nhân viên lễ tân cực kỳ niềm nở.",
    author: "Chị Ngọc Mai & Gia đình",
    from: "Du khách từ TP. Hồ Chí Minh",
  },
  {
    quote: "Đoàn mình đi công tác kết hợp du lịch 12 người, khách sạn hỗ trợ phân bổ phòng hợp lý và xuất hóa đơn VAT điện tử nhanh chóng, đầy đủ theo yêu cầu công ty.",
    author: "Văn phòng Đại diện Suntech",
    from: "Đoàn doanh nghiệp TP. Hải Phòng",
  },
];

const villaReviews: SegmentReview[] = [
  {
    quote: "Gia đình mình 3 thế hệ đi nghỉ dưỡng Đà Lạt, thuê trọn căn villa biệt lập 5 phòng ngủ quá tuyệt vời! Không gian 100% riêng tư, các cháu có sân cỏ chạy nhảy an toàn, người lớn ngồi uống trà ngắm hoàng hôn.",
    author: "Bác Thanh Tùng",
    from: "Đại gia đình từ Hà Nội",
  },
  {
    quote: "Nhóm mình 16 bạn đi teambuilding, người phụ trách gửi 1 link web xem trọn sơ đồ phòng và sân nướng BBQ là cả nhóm đồng ý chốt cọc ngay trong 15 phút. Buổi tối làm tiệc nướng và hát karaoke thả ga không sợ phiền ai.",
    author: "Thùy Linh & Nhóm bạn trẻ",
    from: "Nhóm bạn trẻ từ TP. Hồ Chí Minh",
  },
  {
    quote: "Villa cực kỳ sang trọng, nội thất chỉn chu y như hình ảnh trên web. Bàn bida xịn, bếp đầy đủ gia vị và tủ lạnh lớn. Quản gia hỗ trợ nhóm than nướng BBQ rất chu đáo!",
    author: "Đoàn Teambuilding Kỷ Nguyên Mới",
    from: "Doanh nghiệp TP. Vũng Tàu",
  },
];

interface GalleryPhoto {
  id: string;
  category: "ROOM" | "OUTDOOR" | "CAFE";
  title: string;
  caption: string;
  image: string;
  tag: string;
}

const lodgingGallery: GalleryPhoto[] = [
  {
    id: "gal-1",
    category: "ROOM",
    title: "Phòng ngủ áp mái ngắm trọn thung lũng",
    caption: "Cửa sổ kính lớn đón ánh nắng bình minh và sương mờ đồi thông thơ mộng.",
    image: "/images/demo/homestay_room.jpg",
    tag: "Phòng nghỉ",
  },
  {
    id: "gal-2",
    category: "OUTDOOR",
    title: "Toàn cảnh khuôn viên đồi thông thơ mộng",
    caption: "Không gian biệt lập giữa rừng thông xanh mát, không khí trong lành nguyên bản Đà Lạt.",
    image: "/images/demo/homestay_hero.jpg",
    tag: "Khuôn viên",
  },
  {
    id: "gal-3",
    category: "OUTDOOR",
    title: "Bếp nướng than BBQ & Khu đốt lửa trại ban đêm",
    caption: "Sân cỏ ngoài trời rộng rãi, phục vụ tiệc nướng ấm cúng và quây quần bên đốm lửa.",
    image: "/images/demo/homestay_campfire.jpg",
    tag: "Lửa trại BBQ",
  },
  {
    id: "gal-4",
    category: "CAFE",
    title: "Góc ban công thưởng thức cafe sáng ngắm sương mù",
    caption: "Ly Latte nóng hổi giữa tiết trời se lạnh 16°C đặc trưng của Đà Lạt.",
    image: "/images/demo/cafe_view.jpg",
    tag: "Cafe & View",
  },
];

export function DemoRenderer({
  brief,
  content,
  preset,
  reportHref,
  conceptImagePath,
}: {
  brief: DemoBrief;
  content: DemoContent;
  preset: DemoPreset;
  reportHref?: string | null;
  conceptImagePath?: string | null;
}) {
  const [viewport, setViewport] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
  const isMobileFrame = viewport === "MOBILE";
  const hospitality = /hotel|homestay|khách sạn|nhà nghỉ|resort|lưu trú/i.test(brief.brand.industry || "");
  const isRestaurant = /restaurant|cafe|coffee|nhà hàng|quán ăn|ẩm thực|cà phê/i.test(brief.brand.industry || "");

  const lodgingSegment = useMemo(() => {
    return detectLodgingSegment(brief.brand.businessName, brief.brand.industry);
  }, [brief.brand.businessName, brief.brand.industry]);

  const currentRoomSet = useMemo(() => {
    if (lodgingSegment === "VILLA") return villaRooms;
    if (lodgingSegment === "HOTEL") return hotelRooms;
    return homestayRooms;
  }, [lodgingSegment]);

  const currentReviews = useMemo(() => {
    if (lodgingSegment === "VILLA") return villaReviews;
    if (lodgingSegment === "HOTEL") return hotelReviews;
    return homestayReviews;
  }, [lodgingSegment]);

  const [selectedRoomName, setSelectedRoomName] = useState(currentRoomSet[0].name);
  const [checkIn, setCheckIn] = useState("2026-10-15");
  const [checkOut, setCheckOut] = useState("2026-10-17");
  const [guestCount, setGuestCount] = useState(lodgingSegment === "VILLA" ? "Nhóm 8-10 người" : "2 người lớn");
  const [menuTab, setMenuTab] = useState<"DRINK" | "TEA" | "FOOD">("DRINK");
  const [galleryFilter, setGalleryFilter] = useState<"ALL" | "ROOM" | "OUTDOOR" | "CAFE">("ALL");

  const filteredPhotos = useMemo(() => {
    if (galleryFilter === "ALL") return lodgingGallery;
    return lodgingGallery.filter((p) => p.category === galleryFilter);
  }, [galleryFilter]);

  const t = themes[preset] || themes.WARM_HOSPITALITY;
  const visible = content.sections.filter((s) => s.visible);

  const cleanPhone = (brief.brand.phone || "0900000000").replace(/[^+\d]/g, "");
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${brief.brand.businessName} ${brief.brand.location || ""}`)}`;

  // Find currently selected room details
  const currentRoom = currentRoomSet.find((r) => r.name === selectedRoomName) || currentRoomSet[0];

  // Calculate nights
  const numberOfNights = useMemo(() => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  }, [checkIn, checkOut]);

  const estimatedTotal = currentRoom.pricePerNight * numberOfNights;
  const estimatedStandardTotal = currentRoom.standardPrice * numberOfNights;
  const estimatedSaving = estimatedStandardTotal - estimatedTotal;

  const formatVND = (num: number) => num.toLocaleString("vi-VN") + "đ";

  const buildZaloBookingUrl = () => {
    let msg = "";
    if (lodgingSegment === "VILLA") {
      msg = `Chào ${brief.brand.businessName}, đoàn mình muốn hỏi thuê nguyên căn "${selectedRoomName}" từ ngày ${checkIn} đến ngày ${checkOut} (${numberOfNights} đêm, ${guestCount}). Tạm tính: ${formatVND(estimatedTotal)}. Nhờ villa kiểm tra lịch trống và hướng dẫn cọc giữ căn giúp mình nhé!`;
    } else if (lodgingSegment === "HOTEL") {
      msg = `Chào ${brief.brand.businessName}, mình muốn đặt phòng "${selectedRoomName}" từ ngày ${checkIn} đến ngày ${checkOut} (${numberOfNights} đêm, ${guestCount}). Tạm tính Direct Booking: ${formatVND(estimatedTotal)}. Nhờ khách sạn xác nhận phòng và hỗ trợ thủ tục giúp mình nhé!`;
    } else {
      msg = `Chào ${brief.brand.businessName}, mình muốn hỏi giữ phòng "${selectedRoomName}" từ ngày ${checkIn} đến ngày ${checkOut} (${numberOfNights} đêm, ${guestCount}). Tạm tính: ${formatVND(estimatedTotal)} (hưởng ưu đãi cọc sớm & tặng cafe sáng). Nhờ homestay kiểm tra phòng và báo mình nhé!`;
    }
    return `https://zalo.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const buildZaloTableUrl = () => {
    const msg = `Chào ${brief.brand.businessName}, mình muốn đặt bàn cho ${guestCount} vào ngày ${checkIn}. Nhờ quán tư vấn và xác nhận giúp mình nhé!`;
    return `https://zalo.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const heroImageSrc = conceptImagePath || (isRestaurant ? "/images/demo/cafe_view.jpg" : "/images/demo/homestay_hero.jpg");

  const demoBody = (
    <div className={`min-h-screen ${t.page} font-sans`} data-preset={preset} data-demo-type={brief.demoType}>
      {/* Top Floating Navigation */}
      <header className={`${t.hero} sticky top-0 z-40 border-b border-white/10 backdrop-blur-md bg-opacity-95`}>
        <div className={`mx-auto flex items-center justify-between ${isMobileFrame ? "px-3.5 py-3" : "max-w-6xl px-5 py-4"}`}>
          <div className="flex items-center gap-2.5">
            <span className={`flex items-center justify-center rounded-xl bg-[#c87a38] text-white font-bold shadow-md ${isMobileFrame ? "h-7 w-7 text-xs" : "h-9 w-9 text-base"}`}>
              {hospitality ? "🏡" : isRestaurant ? "☕" : "✨"}
            </span>
            <div>
              <strong className={`font-bold tracking-wide block truncate ${isMobileFrame ? "text-xs max-w-[170px]" : "text-base md:text-lg"}`}>{brief.brand.businessName}</strong>
              <p className="text-[10px] opacity-70 truncate">📍 {brief.brand.location || "Đà Lạt · Lâm Đồng"}</p>
            </div>
          </div>

          {!isMobileFrame && (
            <nav className="hidden items-center gap-6 text-sm md:flex font-medium">
              <a href="#about" className="hover:text-[#c87a38] transition">Không gian</a>
              {hospitality && <a href="#rooms" className="hover:text-[#c87a38] transition">Hạng phòng</a>}
              <a href="#amenities" className="hover:text-[#c87a38] transition">Tiện ích</a>
              <a href="#gallery" className="hover:text-[#c87a38] transition">Ảnh thực tế</a>
              <a href="#reviews" className="hover:text-[#c87a38] transition">Đánh giá</a>
              <a href="#demo-location" className="hover:text-[#c87a38] transition">Vị trí &amp; Bản đồ</a>
              <a
                href={hospitality ? "#booking-widget" : ctaHref(brief)}
                className={`rounded-full px-5 py-2.5 font-bold shadow-lg transition text-xs tracking-wider uppercase ${t.accent}`}
              >
                {content.primaryCTA.label || "Đặt phòng trực tiếp"}
              </a>
            </nav>
          )}

          {isMobileFrame && (
            <a
              href={hospitality ? "#booking-widget" : ctaHref(brief)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold shadow-xs transition uppercase ${t.accent}`}
            >
              Đặt phòng
            </a>
          )}
        </div>
      </header>

      {/* Hero Section with Cinematic Photography */}
      <section className={`relative overflow-hidden bg-slate-950 text-white flex items-center ${isMobileFrame ? "min-h-[440px]" : "min-h-[580px] lg:min-h-[640px]"}`}>
        {/* Background Image with Dark & Warm Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImageSrc}
            alt={`Không gian tại ${brief.brand.businessName}`}
            fill
            priority
            sizes={isMobileFrame ? "390px" : "100vw"}
            className="object-cover object-center transform scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        </div>

        <div className={`relative z-10 mx-auto ${isMobileFrame ? "w-full px-4 py-8" : "max-w-6xl px-5 py-16 lg:py-24"}`}>
          <div className={isMobileFrame ? "w-full" : "max-w-3xl"}>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 backdrop-blur border border-amber-500/30 ${isMobileFrame ? "px-2.5 py-0.5 text-[10px] font-semibold" : "px-3.5 py-1 text-xs font-bold"}`}>
                <span>⭐</span> 4.9/5 trên Google Maps (Đánh giá cao)
              </span>
              <span className={`inline-flex rounded-full bg-white/10 text-slate-200 backdrop-blur border border-white/15 ${isMobileFrame ? "px-2.5 py-0.5 text-[10px]" : "px-3.5 py-1 text-xs font-semibold"}`}>
                📍 {brief.brand.location || "Đà Lạt · Lâm Đồng"}
              </span>
              {conceptImagePath && (
                <span className={`inline-flex rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ${isMobileFrame ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs font-bold"}`}>
                  Hình minh họa concept
                </span>
              )}
            </div>

            <h1 className={`mt-4 font-extrabold leading-[1.18] tracking-tight text-white drop-shadow-md ${isMobileFrame ? "text-2xl" : "text-3xl md:text-5xl lg:text-6xl"}`}>
              {content.headline || `Một nơi để khách hiểu và nhớ về ${brief.brand.businessName}`}
            </h1>

            <p className={`leading-relaxed text-slate-200 drop-shadow ${isMobileFrame ? "mt-2.5 text-xs line-clamp-3" : "mt-5 text-base md:text-lg max-w-2xl"}`}>
              {content.subheadline || "Không gian nghỉ dưỡng ấm cúng giữa thiên nhiên thông reo Đà Lạt. Trải nghiệm bình yên, trọn vẹn và đặt phòng trực tiếp không qua trung gian."}
            </p>

            {/* CTA Group */}
            <div className={`flex flex-wrap items-center gap-2.5 ${isMobileFrame ? "mt-5" : "mt-8 gap-3.5"}`}>
              <a
                href={hospitality ? "#booking-widget" : ctaHref(brief)}
                className={`rounded-full bg-[#c87a38] font-extrabold uppercase tracking-wider text-white shadow-2xl transition hover:bg-[#b36a2e] inline-flex items-center justify-center gap-2 ${isMobileFrame ? "w-full py-3 text-xs" : "px-8 py-4 text-sm transform hover:-translate-y-0.5"}`}
              >
                <span>💬</span> {hospitality ? "Hỏi phòng trống trực tiếp" : content.primaryCTA.label}
              </a>
              {hospitality && (
                <a
                  href="#rooms"
                  className={`rounded-full border border-white/40 bg-white/10 font-bold text-white backdrop-blur transition hover:bg-white/20 inline-flex items-center justify-center gap-2 ${isMobileFrame ? "w-full py-2.5 text-xs" : "px-7 py-4 text-sm"}`}
                >
                  <span>🏡</span> Xem các hạng phòng
                </a>
              )}
            </div>

            <p className={`text-slate-400 ${isMobileFrame ? "mt-3 text-[10px] leading-tight" : "mt-5 text-xs"}`}>
              ✓ Tiết kiệm 15% – 20% phí hoa hồng sàn · ✓ Tư vấn chọn phòng 24/7 · Nội dung có thể điều chỉnh theo thông tin cơ sở
            </p>
          </div>
        </div>
      </section>

      {/* Value Pillars Bar */}
      <section id="about" className={`mx-auto relative z-20 ${isMobileFrame ? "-mt-4 px-3" : "-mt-10 max-w-6xl px-5"}`}>
        <div className={`grid gap-3.5 ${isMobileFrame ? "grid-cols-1" : "sm:grid-cols-3"}`}>
          <div className={`rounded-2xl border shadow-xl backdrop-blur-md ${t.card} transition ${isMobileFrame ? "p-4" : "p-6 transform hover:-translate-y-1"}`}>
            <div className={`${isMobileFrame ? "text-xl mb-1" : "text-2xl mb-2"}`}>🌿</div>
            <strong className={`${isMobileFrame ? "text-sm" : "text-base"} font-bold`}>Không gian, dịch vụ và trải nghiệm</strong>
            <p className="mt-1 text-xs opacity-70 leading-relaxed">
              Trải nghiệm thiên nhiên đồi thông thơ mộng, không khí trong lành nguyên bản Đà Lạt.
            </p>
          </div>
          <div className={`rounded-2xl border shadow-xl backdrop-blur-md ${t.card} transition ${isMobileFrame ? "p-4" : "p-6 transform hover:-translate-y-1"}`}>
            <div className={`${isMobileFrame ? "text-xl mb-1" : "text-2xl mb-2"}`}>⚡</div>
            <strong className={`${isMobileFrame ? "text-sm" : "text-base"} font-bold`}>Đặt phòng trực tiếp 1-chạm</strong>
            <p className="mt-1 text-xs opacity-70 leading-relaxed">
              Giữ phòng trực tiếp qua Zalo chủ cơ sở, xác nhận nhanh, tiết kiệm 15% - 20% phí sàn OTA.
            </p>
          </div>
          <div className={`rounded-2xl border shadow-xl backdrop-blur-md ${t.card} transition ${isMobileFrame ? "p-4" : "p-6 transform hover:-translate-y-1"}`}>
            <div className={`${isMobileFrame ? "text-xl mb-1" : "text-2xl mb-2"}`}>🔍</div>
            <strong className={`${isMobileFrame ? "text-sm" : "text-base"} font-bold`}>Thông tin minh bạch &amp; rõ ràng</strong>
            <p className="mt-1 text-xs opacity-70 leading-relaxed">
              Hình ảnh phòng thật, bảng giá niêm yết rõ, tiện ích và chính sách minh bạch.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Lodging Room Showcase */}
      {hospitality && (
        <section id="rooms" className={`mx-auto ${isMobileFrame ? "px-3 pt-10" : "max-w-6xl px-5 pt-20"}`}>
          <div className={`flex flex-wrap items-end justify-between gap-3 ${isMobileFrame ? "mb-5" : "mb-10"}`}>
            <div>
              <span className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${t.soft}`}>
                Không gian phòng nghỉ
              </span>
              <h2 className={`mt-2 font-extrabold tracking-tight ${isMobileFrame ? "text-xl" : "text-2xl md:text-4xl"}`}>
                Lựa chọn phòng phù hợp cho chuyến đi của bạn
              </h2>
            </div>
            <p className={`opacity-70 ${isMobileFrame ? "text-xs" : "text-xs md:text-sm max-w-md"}`}>
              Mỗi căn phòng đều được chăm chút tỉ mỉ với ánh sáng ấm cúng, cửa sổ lớn đón nắng mai và view đồi thông xanh ngát.
            </p>
          </div>

          <div className={`grid gap-5 ${isMobileFrame ? "grid-cols-1" : "md:grid-cols-3"}`}>
            {currentRoomSet.map((room) => {
              const isSelected = selectedRoomName === room.name;
              return (
                <div
                  key={room.id}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    isSelected ? "ring-2 ring-[#c87a38] shadow-2xl scale-[1.01]" : "shadow-md hover:shadow-xl"
                  } ${t.card}`}
                >
                  <div>
                    {/* Room Image with Tag */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={room.image}
                        alt={room.name}
                        fill
                        sizes={isMobileFrame ? "390px" : "(max-width: 768px) 100vw, 33vw"}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                        <span className="font-semibold bg-black/50 backdrop-blur px-2 py-0.5 rounded-full">
                          👥 {room.capacity}
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full truncate max-w-[200px] ${
                            lodgingSegment === "HOTEL"
                              ? "bg-rose-600/90"
                              : lodgingSegment === "VILLA"
                              ? "bg-indigo-600/90"
                              : "bg-emerald-600/90"
                          }`}
                        >
                          {lodgingSegment === "HOTEL"
                            ? `Tiết kiệm ${(room.standardPrice - room.pricePerNight).toLocaleString("vi-VN")}đ phí OTA`
                            : `🎁 ${room.perkBadge}`}
                        </span>
                      </div>
                    </div>

                    {/* Room Details */}
                    <div className="p-4 md:p-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs line-through opacity-50">
                          {lodgingSegment === "HOTEL"
                            ? "Sàn OTA: "
                            : lodgingSegment === "VILLA"
                            ? "Tiêu chuẩn: "
                            : "Niêm yết: "}
                          {room.standardPrice.toLocaleString("vi-VN")}đ
                        </span>
                        <div className="text-right">
                          <span className="text-lg md:text-xl font-extrabold text-[#c87a38]">{room.pricePerNight.toLocaleString("vi-VN")}đ</span>
                          <span className="text-xs opacity-60"> / đêm</span>
                        </div>
                      </div>

                      <h3 className="mt-1.5 text-base md:text-lg font-bold leading-snug">{room.name}</h3>
                      <p className="mt-1 text-xs opacity-70">📍 {room.view}</p>

                      {/* Amenities Pills */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {room.features.map((feat) => (
                          <span key={feat} className={`rounded-lg px-2 py-0.5 text-[10px] md:text-[11px] font-medium ${t.soft}`}>
                            ✓ {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoomName(room.name);
                        const widget = document.getElementById("booking-widget");
                        if (widget) widget.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`w-full rounded-xl py-2.5 md:py-3 text-xs font-bold uppercase tracking-wider transition ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-md"
                          : "border border-[#c87a38] text-[#c87a38] hover:bg-[#c87a38] hover:text-white"
                      }`}
                    >
                      {isSelected ? "✓ Đang chọn phòng này" : "Chọn phòng này"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Smart Live-Pricing Lodging Booking Widget */}
      {hospitality && (
        <section id="booking-widget" className={`mx-auto ${isMobileFrame ? "px-3 pt-10" : "max-w-6xl px-5 pt-16"}`}>
          <div className={`rounded-3xl border-2 border-[#c87a38]/40 shadow-2xl bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 ${t.card} ${isMobileFrame ? "p-4" : "p-6 md:p-10"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
                  Hỏi phòng trống trực tiếp qua Zalo
                </span>
                <h3 className={`mt-1.5 font-extrabold tracking-tight ${isMobileFrame ? "text-lg" : "text-2xl md:text-3xl"}`}>
                  Kiểm tra lịch &amp; Nhận báo giá trực tiếp
                </h3>
              </div>
              <div className={`rounded-xl bg-emerald-50 border border-emerald-200 text-right ${isMobileFrame ? "p-2.5 w-full text-left" : "px-4 py-2.5"}`}>
                <span className="text-xs font-bold text-emerald-800">
                  {lodgingSegment === "HOTEL"
                    ? "🎉 Direct Booking: Tiết kiệm 15% – 22%"
                    : lodgingSegment === "VILLA"
                    ? "🎉 Thuê nguyên căn: 100% riêng tư biệt lập"
                    : "🎉 Đặt cọc trực tiếp: Giữ trọn ưu đãi"}
                </span>
                <p className="text-[11px] text-emerald-600">
                  {lodgingSegment === "HOTEL"
                    ? "Bao gồm ăn sáng & hóa đơn VAT"
                    : lodgingSegment === "VILLA"
                    ? "Sân BBQ & phòng Karaoke không chung đụng"
                    : "Tặng cafe sáng & hỗ trợ xe máy"}
                </p>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className={`mt-6 grid gap-3 ${isMobileFrame ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">1. Hạng phòng muốn đặt</label>
                <select
                  value={selectedRoomName}
                  onChange={(e) => setSelectedRoomName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-800 shadow-sm focus:border-[#c87a38] focus:outline-none"
                >
                  {currentRoomSet.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name} ({formatVND(r.pricePerNight)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">2. Ngày nhận phòng (Check-in)</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-800 shadow-sm focus:border-[#c87a38] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">3. Ngày trả phòng (Check-out)</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-800 shadow-sm focus:border-[#c87a38] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">4. Số lượng khách</label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-800 shadow-sm focus:border-[#c87a38] focus:outline-none"
                >
                  <option value="1 người lớn">1 người lớn</option>
                  <option value="2 người lớn">2 người lớn</option>
                  <option value="2 người lớn, 1 trẻ em">2 người lớn, 1 trẻ em</option>
                  <option value="Nhóm 4 người">Nhóm 4 người</option>
                  <option value="Gia đình 6-8 người">Gia đình 6-8 người</option>
                  <option value="Đoàn lớn 10-15 người">Đoàn lớn 10-15 người</option>
                  <option value="Đoàn lớn 16-25 người">Đoàn lớn 16-25 người</option>
                </select>
              </div>
            </div>

            {/* Price Calculation & Zalo Action */}
            <div className={`mt-6 rounded-2xl bg-slate-900 text-white shadow-xl ${isMobileFrame ? "p-4 space-y-3" : "p-6 flex flex-wrap items-center justify-between gap-5"}`}>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Thời gian: <strong>{numberOfNights} đêm</strong></span>
                  <span>·</span>
                  <span>Giá: <strong>{formatVND(currentRoom.pricePerNight)}/đêm</strong></span>
                </div>
                <div className={`mt-1.5 flex items-baseline gap-2 ${isMobileFrame ? "flex-wrap" : ""}`}>
                  <span className={`${isMobileFrame ? "text-xl" : "text-2xl md:text-3xl"} font-extrabold text-[#dfb46c]`}>
                    Tạm tính: {formatVND(estimatedTotal)}
                  </span>
                  <span className="text-[11px] text-slate-400 line-through">
                    {lodgingSegment === "HOTEL"
                      ? `${formatVND(estimatedStandardTotal)} trên sàn OTA`
                      : lodgingSegment === "VILLA"
                      ? `${formatVND(estimatedStandardTotal)} giá tiêu chuẩn`
                      : `${formatVND(estimatedStandardTotal)} giá niêm yết`}
                  </span>
                  {estimatedSaving > 0 && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      {lodgingSegment === "HOTEL"
                        ? `Tiết kiệm ~${formatVND(estimatedSaving)} phí sàn`
                        : `Ưu đãi cọc sớm: ~${formatVND(estimatedSaving)}`}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {lodgingSegment === "HOMESTAY"
                    ? "* Giá ưu đãi cọc sớm đã bao gồm tiện ích sân BBQ & cafe sáng, homestay sẽ xác nhận ngay khi bạn nhắn."
                    : lodgingSegment === "HOTEL"
                    ? "* Giá Direct Booking trực tiếp đã bao gồm ăn sáng buffet và hỗ trợ hóa đơn VAT."
                    : "* Giá nguyên căn trọn gói cho khách đoàn, không phát sinh phụ thu cơ bản."}
                </p>
              </div>

              <a
                href={buildZaloBookingUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-full bg-[#0068ff] font-extrabold text-white shadow-xl transition hover:bg-[#0054d1] inline-flex items-center justify-center gap-2 ${isMobileFrame ? "w-full py-3 text-xs" : "px-8 py-4 text-sm md:text-base transform hover:scale-105"}`}
              >
                <span>💬</span> {lodgingSegment === "VILLA" ? "Hỏi thuê nguyên căn qua Zalo" : lodgingSegment === "HOTEL" ? "Direct Booking qua Zalo" : "Hỏi phòng trống & cọc qua Zalo"}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Restaurant / Cafe Menu Widget */}
      {isRestaurant && (
        <section id="menu-widget" className={`mx-auto ${isMobileFrame ? "px-3 pt-10" : "max-w-6xl px-5 pt-20"}`}>
          <div className={`rounded-3xl border shadow-xl ${t.card} ${isMobileFrame ? "p-4" : "p-6 md:p-10"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${t.soft}`}>
                  Menu điện tử trực quan
                </span>
                <h3 className={`mt-1.5 font-extrabold ${isMobileFrame ? "text-lg" : "text-2xl md:text-3xl"}`}>Khám phá các món đặc trưng của quán</h3>
              </div>
              <a
                href={buildZaloTableUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow transition ${t.accent}`}
              >
                Đặt bàn &amp; Giữ chỗ trước
              </a>
            </div>

            <div className="mt-6 flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setMenuTab("DRINK")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition whitespace-nowrap ${menuTab === "DRINK" ? t.soft : "hover:bg-slate-100"}`}
              >
                ☕ Cà phê &amp; Đồ uống
              </button>
              <button
                type="button"
                onClick={() => setMenuTab("TEA")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition whitespace-nowrap ${menuTab === "TEA" ? t.soft : "hover:bg-slate-100"}`}
              >
                🍵 Trà &amp; Bánh ngọt
              </button>
              <button
                type="button"
                onClick={() => setMenuTab("FOOD")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition whitespace-nowrap ${menuTab === "FOOD" ? t.soft : "hover:bg-slate-100"}`}
              >
                🍲 Món ăn đặc sản
              </button>
            </div>

            <div className={`mt-6 grid gap-4 ${isMobileFrame ? "grid-cols-1" : "sm:grid-cols-3"}`}>
              {menuTab === "DRINK" && (
                <>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">★ Best-Seller</span>
                    <h4 className="mt-2 font-bold text-sm">Cà phê pha phin nguyên chất</h4>
                    <p className="mt-1 text-xs opacity-70">Hạt Arabica Cầu Đất phối Robusta Đắk Lắk đậm vị thơm nồng</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">35.000đ</div>
                  </div>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Đặc sản Đà Lạt</span>
                    <h4 className="mt-2 font-bold text-sm">Cà phê muối béo ngậy</h4>
                    <p className="mt-1 text-xs opacity-70">Lớp kem muối bồng bềnh hài hòa cùng vị cà phê đắng êm dịu</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">45.000đ</div>
                  </div>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">Thanh mát</span>
                    <h4 className="mt-2 font-bold text-sm">Cold Brew cam vàng</h4>
                    <p className="mt-1 text-xs opacity-70">Ủ lạnh 16 tiếng thơm mát hương vỏ cam vàng tự nhiên</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">55.000đ</div>
                  </div>
                </>
              )}
              {menuTab === "TEA" && (
                <>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">★ Best-Seller</span>
                    <h4 className="mt-2 font-bold text-sm">Trà đào dâu tây Đà Lạt</h4>
                    <p className="mt-1 text-xs opacity-70">Dâu tây tươi hái tại vườn Đà Lạt chua ngọt thơm ngon</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">50.000đ</div>
                  </div>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Thơm dịu</span>
                    <h4 className="mt-2 font-bold text-sm">Trà lài mãng cầu xiêm</h4>
                    <p className="mt-1 text-xs opacity-70">Hương lài tinh tế kết hợp thịt mãng cầu tươi giòn</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">52.000đ</div>
                  </div>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5">Homemade</span>
                    <h4 className="mt-2 font-bold text-sm">Bánh sừng bò bơ Pháp</h4>
                    <p className="mt-1 text-xs opacity-70">Bánh nướng nóng giòn từng lớp thơm lừng bơ cao cấp</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">42.000đ</div>
                  </div>
                </>
              )}
              {menuTab === "FOOD" && (
                <>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">★ Món chính</span>
                    <h4 className="mt-2 font-bold text-sm">Bánh mì xíu mại chén nóng</h4>
                    <p className="mt-1 text-xs opacity-70">Xíu mại thịt nạc thơm mềm nước dùng ngọt thanh cay nồng</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">45.000đ</div>
                  </div>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">Ăn nhẹ</span>
                    <h4 className="mt-2 font-bold text-sm">Khoai tây chiên phô mai</h4>
                    <p className="mt-1 text-xs opacity-70">Khoai tây tươi giòn rụm phủ bột phô mai béo ngậy</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">40.000đ</div>
                  </div>
                  <div className={`rounded-2xl p-5 border ${t.card} shadow-sm`}>
                    <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5">Healthy</span>
                    <h4 className="mt-2 font-bold text-sm">Salad ức gà mè rang</h4>
                    <p className="mt-1 text-xs opacity-70">Rau củ thủy canh tươi giòn Đà Lạt bổ dưỡng</p>
                    <div className="mt-3 font-extrabold text-[#c87a38]">65.000đ</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Exclusive Amenities & Perks */}
      <section id="amenities" className={`mx-auto ${isMobileFrame ? "px-3 pt-10" : "max-w-6xl px-5 pt-20"}`}>
        <div className={`text-center max-w-2xl mx-auto ${isMobileFrame ? "mb-6" : "mb-12"}`}>
          <span className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${t.soft}`}>
            Trải nghiệm &amp; Tiện ích
          </span>
          <h2 className={`mt-2 font-extrabold ${isMobileFrame ? "text-xl" : "text-2xl md:text-4xl"}`}>Đặc quyền dành riêng cho khách lưu trú</h2>
          <p className={`mt-1.5 opacity-70 ${isMobileFrame ? "text-xs" : "text-xs md:text-sm"}`}>
            Tận hưởng trọn vẹn từng khoảnh khắc nghỉ ngơi với đầy đủ dịch vụ chu đáo.
          </p>
        </div>

        <div className={`grid gap-3.5 ${isMobileFrame ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {lodgingSegment === "HOMESTAY" && (
            <>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl mb-2">🛵</div>
                <h4 className="font-bold text-xs md:text-base">Thuê xe máy tận phòng</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Xe ga &amp; số đời mới giao tại sân, kèm 2 mũ bảo hiểm tiện lợi.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl mb-2">🪵</div>
                <h4 className="font-bold text-xs md:text-base">Lửa trại &amp; BBQ</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Sân cỏ thoáng đãng, cung cấp sẵn than nướng và bếp nướng than hoa.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl mb-2">🍳</div>
                <h4 className="font-bold text-xs md:text-base">Bữa sáng nóng hổi</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Bánh mì xíu mại chén nóng phục vụ tận ban công kèm cafe sáng.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl mb-2">☕</div>
                <h4 className="font-bold text-xs md:text-base">Cafe Thung Lũng</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Cà phê Arabica Cầu Đất nguyên chất ngắm bình minh sương mờ.</p>
              </div>
            </>
          )}

          {lodgingSegment === "HOTEL" && (
            <>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl mb-2">🛎️</div>
                <h4 className="font-bold text-xs md:text-base">Lễ tân &amp; Bảo vệ 24/7</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Nhận trả phòng linh hoạt, gửi hành lý và an ninh camera toàn khuôn viên.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl mb-2">🍳</div>
                <h4 className="font-bold text-xs md:text-base">Buffet sáng đa dạng</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Thực đơn phong phú từ món nóng truyền thống đến nước ép tươi mỗi ngày.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl mb-2">🚗</div>
                <h4 className="font-bold text-xs md:text-base">Bãi đỗ xe ô tô rộng</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Chỗ đỗ an toàn cho xe 4-29 chỗ, nhân viên điều phối chu đáo.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-xl mb-2">🧾</div>
                <h4 className="font-bold text-xs md:text-base">Hóa đơn VAT công tác</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Xuất hóa đơn điện tử VAT đầy đủ, nhanh chóng cho các đoàn thể công tác.</p>
              </div>
            </>
          )}

          {lodgingSegment === "VILLA" && (
            <>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl mb-2">🥩</div>
                <h4 className="font-bold text-xs md:text-base">Sân cỏ tiệc BBQ</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Sân hiên ngoài trời rộng rãi, trang bị đầy đủ bếp nướng than hoa cho 15–20 người.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-xl mb-2">🎱</div>
                <h4 className="font-bold text-xs md:text-base">Bida &amp; Phòng Karaoke</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Giải trí gia đình cách âm tốt, bàn bida chuẩn và dàn âm thanh chất lượng.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl mb-2">🏡</div>
                <h4 className="font-bold text-xs md:text-base">100% Riêng tư biệt lập</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Nguyên căn villa không chung đụng, tự do nấu nướng sinh hoạt thoải mái.</p>
              </div>
              <div className={`rounded-2xl border ${isMobileFrame ? "p-3.5" : "p-6"} text-center ${t.card} shadow-sm`}>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl mb-2">🚗</div>
                <h4 className="font-bold text-xs md:text-base">Gara đỗ xe riêng</h4>
                <p className="mt-1 text-[11px] opacity-70 leading-relaxed">Sân trong đỗ vừa 3–4 xe ô tô 7 chỗ, đường vào bằng phẳng thuận tiện.</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Interactive Photo Gallery Showcase */}
      <section id="gallery" className={`mx-auto ${isMobileFrame ? "px-3 pt-10" : "max-w-6xl px-5 pt-20"}`}>
        <div className={`flex flex-wrap items-end justify-between gap-3 ${isMobileFrame ? "mb-4" : "mb-8"}`}>
          <div>
            <span className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${t.soft}`}>
              Bộ sưu tập hình ảnh
            </span>
            <h2 className={`mt-2 font-extrabold tracking-tight ${isMobileFrame ? "text-xl" : "text-2xl md:text-4xl"}`}>
              Góc ảnh thực tế tại {brief.brand.businessName}
            </h2>
          </div>
          <p className={`opacity-70 ${isMobileFrame ? "text-xs" : "text-xs md:text-sm max-w-md"}`}>
            Hình ảnh chân thực, giúp khách du lịch dễ dàng cảm nhận vẻ đẹp không gian trước khi chốt lịch đặt phòng.
          </p>
        </div>

        {/* Gallery Tabs */}
        <div className={`flex flex-wrap gap-2 border-b border-slate-200/80 pb-3 ${isMobileFrame ? "mb-4" : "mb-6"}`}>
          {[
            { key: "ALL", label: "✨ Tất cả ảnh" },
            { key: "ROOM", label: "🛏️ Phòng ngủ" },
            { key: "OUTDOOR", label: "🪵 Sân vườn BBQ" },
            { key: "CAFE", label: "☕ Cafe ngắm mây" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setGalleryFilter(tab.key as "ALL" | "ROOM" | "OUTDOOR" | "CAFE")}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${
                galleryFilter === tab.key ? t.soft : "hover:bg-slate-100 opacity-70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className={`grid gap-4 ${isMobileFrame ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`group overflow-hidden rounded-2xl border ${t.card} shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={photo.image}
                  alt={photo.title}
                  fill
                  sizes={isMobileFrame ? "390px" : "(max-width: 1024px) 50vw, 25vw"}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-75 group-hover:opacity-90 transition-opacity" />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/50 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {photo.tag}
                </span>
              </div>
              <div className="p-3.5">
                <h4 className="font-bold text-sm leading-snug line-clamp-1">{photo.title}</h4>
                <p className="mt-1 text-xs opacity-70 line-clamp-2 leading-relaxed">{photo.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Real Google Maps Social Proof / Reviews */}
      <section id="reviews" className={`mx-auto ${isMobileFrame ? "px-3 pt-10" : "max-w-6xl px-5 pt-20"}`}>
        <div className={`rounded-3xl border shadow-xl bg-gradient-to-b from-white to-slate-50/50 ${t.card} ${isMobileFrame ? "p-5" : "p-8 md:p-12"}`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 ${isMobileFrame ? "mb-5" : "mb-8"}`}>
            <div>
              <span className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${t.soft}`}>
                Đánh giá khách hàng
              </span>
              <h3 className={`mt-1.5 font-extrabold ${isMobileFrame ? "text-lg" : "text-2xl md:text-3xl"}`}>Cảm nhận từ những du khách đã ghé thăm</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 text-base">★★★★★</span>
              <span className="font-extrabold text-sm">4.9 / 5.0</span>
              <span className="text-[11px] opacity-60">(Google Maps)</span>
            </div>
          </div>

          <div className={`grid gap-4 ${isMobileFrame ? "grid-cols-1" : "md:grid-cols-3"}`}>
            {currentReviews.map((rev) => (
              <div
                key={rev.author}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="text-amber-500 text-xs">★★★★★</div>
                  <p className="mt-2.5 text-xs md:text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{rev.quote}&rdquo;
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <strong className="text-slate-900 font-bold">{rev.author}</strong>
                  <span className="text-slate-500 block text-[11px]">{rev.from}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Sections (from dynamic content if any) */}
      <section className={`mx-auto ${isMobileFrame ? "px-3 py-10" : "max-w-6xl px-5 py-16"}`}>
        <div className={`grid gap-4 ${isMobileFrame ? "grid-cols-1" : "md:grid-cols-2"}`}>
          {visible.map((s, i) => (
            <div
              id={s.id}
              key={s.id}
              className={`rounded-3xl border shadow-xs transition hover:shadow-md ${t.card} ${isMobileFrame ? "p-5" : "p-7"}`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${t.soft}`}>
                  0{i + 1}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">
                  {labels[s.id] || "Thông tin"}
                </span>
              </div>
              <h3 className="mt-3 text-base md:text-lg font-bold">{labels[s.id] || s.title}</h3>
              <p className="mt-1.5 text-xs md:text-sm leading-relaxed opacity-75">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Google Maps & Directions Card */}
      <section id="demo-location" className={`mx-auto ${isMobileFrame ? "px-3 pb-12" : "max-w-6xl px-5 pb-20"}`}>
        <div className={`rounded-3xl border ${t.card} shadow-xl flex flex-wrap items-center justify-between gap-6 bg-gradient-to-r from-white via-slate-50 to-amber-50/20 ${isMobileFrame ? "p-5" : "p-8 md:p-12"}`}>
          <div className="max-w-xl">
            <span className={`inline-flex rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${t.soft}`}>
              Vị trí &amp; Chỉ đường
            </span>
            <h3 className={`mt-2 font-extrabold ${isMobileFrame ? "text-xl" : "text-2xl md:text-3xl"}`}>{brief.brand.businessName}</h3>
            <p className="mt-1.5 text-xs md:text-sm opacity-80 leading-relaxed">
              📍 {brief.brand.location || "25/34/3, Đường Nhà Chung, Xuân Hương, TP. Đà Lạt"}
            </p>

            {/* Travel Distances */}
            <div className={`mt-4 grid grid-cols-3 gap-2 text-[11px]`}>
              <div className="rounded-xl border bg-white p-2.5 shadow-xs text-center">
                <strong className="block text-slate-900 font-bold">5 phút</strong>
                <span className="text-slate-500">Hồ Xuân Hương</span>
              </div>
              <div className="rounded-xl border bg-white p-2.5 shadow-xs text-center">
                <strong className="block text-slate-900 font-bold">8 phút</strong>
                <span className="text-slate-500">Chợ Đêm Đà Lạt</span>
              </div>
              <div className="rounded-xl border bg-white p-2.5 shadow-xs text-center">
                <strong className="block text-slate-900 font-bold">20 phút</strong>
                <span className="text-slate-500">Săn Mây Cầu Đất</span>
              </div>
            </div>
          </div>

          <div className={`flex ${isMobileFrame ? "flex-col w-full" : "flex-col sm:flex-row"} gap-2.5`}>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full bg-[#1a73e8] font-bold text-white shadow-md transition hover:bg-[#1557b0] inline-flex items-center justify-center gap-2 ${isMobileFrame ? "py-3 text-xs w-full" : "px-8 py-4 text-sm"}`}
            >
              <span>🗺️</span> Chỉ đường Google Maps
            </a>
            {brief.brand.phone && (
              <a
                href={`tel:${cleanPhone}`}
                className={`rounded-full border border-slate-300 bg-white font-bold text-slate-800 shadow-xs transition hover:bg-slate-50 inline-flex items-center justify-center gap-2 ${isMobileFrame ? "py-2.5 text-xs w-full" : "px-7 py-4 text-sm"}`}
              >
                <span>📞</span> Gọi hotline {brief.brand.phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Next Step Footer for Prospect Conversion */}
      <footer id="demo-contact" className={`${t.hero} text-center relative overflow-hidden ${isMobileFrame ? "px-4 py-12" : "px-5 py-20"}`}>
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-flex rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300 border border-white/15 backdrop-blur">
            Bản Demo Trải Nghiệm Số Từ 3DUA Media
          </span>
          <h2 className={`mt-4 font-extrabold tracking-tight ${isMobileFrame ? "text-xl" : "text-2xl md:text-4xl"}`}>
            Nếu hướng giao diện này phù hợp, 3DUA Media sẽ cùng hoàn thiện hệ thống tiếp thị & đặt lịch thật cho {brief.brand.businessName}
          </h2>
          <p className="mt-3 text-xs md:text-sm text-slate-300 leading-relaxed">
            Hệ thống tiếp thị số toàn diện: sản xuất media view đẹp, tích hợp đặt lịch/chốt cọc Zalo 1-chạm, chuẩn SEO Google Maps và chạy quảng cáo đón khách hiệu quả.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`https://zalo.me/${process.env.PUBLIC_CONSULTANT_PHONE || "0900000000"}?text=${encodeURIComponent(`Chào 3DUA Media, mình vừa xem bản demo trải nghiệm cho ${brief.brand.businessName} thấy rất ưng. Nhờ bên bạn tư vấn giải pháp marketing toàn diện giúp mình nhé!`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-full bg-[#0068ff] font-bold text-white shadow-xl transition hover:bg-[#0054d1] inline-flex items-center justify-center gap-2 ${isMobileFrame ? "w-full py-3 text-xs" : "px-8 py-4 text-sm"}`}
            >
              <span>💬</span> Nhắn Zalo tư vấn triển khai ngay
            </a>
            {reportHref && (
              <a
                href={reportHref}
                className={`rounded-full border border-white/30 bg-white/10 font-bold text-white backdrop-blur transition hover:bg-white/20 ${isMobileFrame ? "w-full py-2.5 text-xs" : "px-7 py-4 text-sm"}`}
              >
                ← Xem lại Báo cáo
              </a>
            )}
          </div>
          <p className="mt-6 text-[11px] opacity-50">
            Bản minh họa giao diện tham khảo định hướng · Không phải website chính thức của cơ sở
          </p>
        </div>
      </footer>

      {/* Mobile Sticky Action Bar */}
      {!isMobileFrame && (
        <div data-mobile-sticky-cta className="fixed inset-x-3 bottom-3 z-30 flex gap-2 md:hidden">
          <a
            href={hospitality ? "#booking-widget" : ctaHref(brief)}
            className="flex-1 rounded-2xl bg-[#c87a38] px-4 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider text-white shadow-2xl inline-flex items-center justify-center gap-1.5"
          >
            <span>💬</span> {hospitality ? "Hỏi phòng qua Zalo" : "Liên hệ ngay"}
          </a>
          {brief.brand.phone && (
            <a
              href={`tel:${cleanPhone}`}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-xs font-bold text-slate-800 shadow-xl inline-flex items-center justify-center gap-1"
            >
              <span>📞</span> Gọi
            </a>
          )}
        </div>
      )}

      {isMobileFrame && (
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 flex gap-2 shadow-2xl">
          <a
            href={hospitality ? "#booking-widget" : ctaHref(brief)}
            className="flex-1 rounded-xl bg-[#c87a38] px-3 py-2.5 text-center text-xs font-extrabold uppercase tracking-wider text-white shadow inline-flex items-center justify-center gap-1.5"
          >
            <span>💬</span> {hospitality ? "Hỏi phòng qua Zalo" : "Liên hệ ngay"}
          </a>
          {brief.brand.phone && (
            <a
              href={`tel:${cleanPhone}`}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow inline-flex items-center justify-center gap-1"
            >
              <span>📞</span> Gọi
            </a>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top Controller Bar */}
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 px-4 py-3 text-white backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c87a38] text-xs font-bold">
            📱
          </span>
          <span className="text-xs font-bold tracking-wider text-slate-300">
            CHẾ ĐỘ XEM DEMO: <span className="text-white">{brief.brand.businessName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {reportHref && (
            <a
              href={reportHref}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/20"
            >
              ← Xem lại Báo cáo
            </a>
          )}
          <div className="flex rounded-lg bg-white/10 p-1">
            <button
              type="button"
              onClick={() => setViewport("DESKTOP")}
              className={`rounded px-3 py-1 text-xs font-bold transition ${
                viewport === "DESKTOP" ? "bg-[#c87a38] text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              💻 Màn hình rộng
            </button>
            <button
              type="button"
              onClick={() => setViewport("MOBILE")}
              className={`rounded px-3 py-1 text-xs font-bold transition ${
                viewport === "MOBILE" ? "bg-[#c87a38] text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              📱 Giao diện điện thoại (Khung iPhone 16)
            </button>
          </div>
        </div>
      </div>

      {/* Viewport Rendering */}
      {viewport === "DESKTOP" ? (
        demoBody
      ) : (
        <div className="flex justify-center p-4 lg:p-10 overflow-x-hidden bg-slate-950">
          {/* Phone Mockup Simulator Container */}
          <div className="relative w-[390px] h-[844px] rounded-[52px] bg-black p-3 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_0_10px_#2a2a2e] ring-1 ring-white/20 flex flex-col justify-between">
            {/* Dynamic Island Notch */}
            <div className="absolute left-1/2 top-4 z-50 h-7 w-28 -translate-x-1/2 rounded-full bg-black flex items-center justify-end pr-2.5">
              <div className="h-3 w-3 rounded-full bg-[#111] ring-1 ring-white/10" />
            </div>

            {/* Scrollable Viewport */}
            <div className="h-full w-full overflow-y-auto overflow-x-hidden rounded-[40px] bg-white scrollbar-none pt-2 flex flex-col">
              <div className="flex-1">
                {demoBody}
              </div>
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="absolute bottom-4 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-white/40 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
