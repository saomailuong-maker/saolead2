/**
 * Vietnam Phone Number Classification & Formatting Utilities
 *
 * Rules:
 * - Mobile: 10 digits starting with 03, 05, 07, 08, 09 (supports personal Zalo)
 * - Landline (Cố định / Máy bàn): Starts with 02x (10-11 digits) following the 2017 national numbering plan (does NOT support personal Zalo)
 * - Hotline: 1800 / 1900
 */

export type PhoneType = "MOBILE" | "LANDLINE" | "HOTLINE" | "UNKNOWN" | "NONE";

export interface PhoneClassification {
  raw: string | null;
  normalized: string;
  type: PhoneType;
  isZaloSupported: boolean;
  label: string;
  provinceName?: string;
  receptionistScript?: string;
}

// Vietnam Fixed-line Area Codes (Bảng mã vùng cố định 63 tỉnh thành)
export const VIETNAM_AREA_CODES: Record<string, string> = {
  "024": "Hà Nội",
  "028": "TP. Hồ Chí Minh",
  "0203": "Quảng Ninh",
  "0204": "Bắc Giang",
  "0205": "Lạng Sơn",
  "0206": "Cao Bằng",
  "0207": "Tuyên Quang",
  "0208": "Thái Nguyên",
  "0209": "Bắc Kạn",
  "0210": "Phú Thọ",
  "0211": "Vĩnh Phúc",
  "0212": "Sơn La",
  "0213": "Lai Châu",
  "0214": "Lào Cai",
  "0215": "Điện Biên",
  "0216": "Yên Bái",
  "0218": "Hòa Bình",
  "0219": "Hà Giang",
  "0220": "Hải Dương",
  "0221": "Hưng Yên",
  "0222": "Bắc Ninh",
  "0225": "Hải Phòng",
  "0226": "Hà Nam",
  "0227": "Thái Bình",
  "0228": "Nam Định",
  "0229": "Ninh Bình",
  "0232": "Quảng Bình",
  "0233": "Quảng Trị",
  "0234": "Thừa Thiên - Huế",
  "0235": "Quảng Nam",
  "0236": "Đà Nẵng",
  "0237": "Thanh Hóa",
  "0238": "Nghệ An",
  "0239": "Hà Tĩnh",
  "0251": "Đồng Nai",
  "0252": "Bình Thuận",
  "0254": "Bà Rịa - Vũng Tàu",
  "0255": "Quảng Ngãi",
  "0256": "Bình Định",
  "0257": "Phú Yên",
  "0258": "Khánh Hòa",
  "0259": "Ninh Thuận",
  "0260": "Kon Tum",
  "0261": "Đắk Nông",
  "0262": "Đắk Lắk",
  "0263": "Lâm Đồng",
  "0269": "Gia Lai",
  "0270": "Vĩnh Long",
  "0271": "Bình Phước",
  "0272": "Long An",
  "0273": "Tiền Giang",
  "0274": "Bình Dương",
  "0275": "Bến Tre",
  "0276": "Tây Ninh",
  "0277": "Đồng Tháp",
  "0290": "Cà Mau",
  "0291": "Bạc Liêu",
  "0292": "Cần Thơ",
  "0293": "Hậu Giang",
  "0294": "Trà Vinh",
  "0296": "An Giang",
  "0297": "Kiên Giang",
  "0299": "Sóc Trăng",
};

/**
 * Clean and normalize a phone string into standard Vietnam digits (e.g. 0912345678 or 02633821234)
 */
export function normalizePhoneNumber(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "";
  let digits = rawPhone.replace(/\D/g, "");

  // Convert international +84 / 84 prefix to standard 0
  if (digits.startsWith("84") && digits.length >= 10) {
    digits = "0" + digits.slice(2);
  }

  return digits;
}

/**
 * Classify a phone number into Mobile, Landline (with province), Hotline, or Unknown.
 */
export function classifyPhoneNumber(rawPhone: string | null | undefined): PhoneClassification {
  if (!rawPhone || !rawPhone.trim()) {
    return {
      raw: null,
      normalized: "",
      type: "NONE",
      isZaloSupported: false,
      label: "Chưa có số",
    };
  }

  const normalized = normalizePhoneNumber(rawPhone);

  // Check Hotline: 1800, 1900
  if (normalized.startsWith("1800") || normalized.startsWith("1900")) {
    return {
      raw: rawPhone,
      normalized,
      type: "HOTLINE",
      isZaloSupported: false,
      label: "Tổng đài / Hotline",
    };
  }

  // Check Mobile (10 digits starting with 03, 05, 07, 08, 09)
  if (/^0[35789]\d{8}$/.test(normalized)) {
    return {
      raw: rawPhone,
      normalized,
      type: "MOBILE",
      isZaloSupported: true,
      label: "Di động (Zalo sẵn sàng)",
    };
  }

  // Check Landline (Starts with 02, followed by 8 or 9 digits -> 10-11 total digits)
  if (normalized.startsWith("02") && normalized.length >= 9 && normalized.length <= 11) {
    // Determine province from area code (check 4-digit code first, then 3-digit)
    let province = "Toàn quốc";
    const code4 = normalized.slice(0, 4);
    const code3 = normalized.slice(0, 3);

    if (VIETNAM_AREA_CODES[code4]) {
      province = VIETNAM_AREA_CODES[code4];
    } else if (VIETNAM_AREA_CODES[code3]) {
      province = VIETNAM_AREA_CODES[code3];
    }

    return {
      raw: rawPhone,
      normalized,
      type: "LANDLINE",
      isZaloSupported: false,
      provinceName: province,
      label: `Máy bàn (${province})`,
      receptionistScript:
        "Dạ em chào anh/chị lễ tân, em là Sao bên giải pháp tối ưu đặt phòng cho khách sạn. Bên em vừa lập bản báo cáo thẩm định kênh Google Maps & bản demo đặt phòng trực tiếp gửi tặng cơ sở mình. Anh/chị cho em xin số Zalo của anh/chị Quản lý hoặc Chủ khách sạn để em gửi bản phân tích qua Zalo nhé ạ!",
    };
  }

  return {
    raw: rawPhone,
    normalized,
    type: "UNKNOWN",
    isZaloSupported: false,
    label: "Số khác / Cần kiểm tra",
  };
}

/**
 * Build direct Zalo URL if phone is mobile, otherwise return null
 */
export function getZaloDirectUrl(phone: string | null | undefined, message?: string): string | null {
  const info = classifyPhoneNumber(phone);
  if (!info.isZaloSupported) return null;
  const baseUrl = `https://zalo.me/${info.normalized}`;
  return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
}
