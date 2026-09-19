import type { SearchBusinessesInput } from "./query";

export type Coordinates = { latitude: number; longitude: number };
export type SearchViewport = { low: Coordinates; high: Coordinates };
export type SearchArea = { label: SearchBusinessesInput["location"]; center: Coordinates; radiusMeters: number; provinceTokens: string[]; localityTokens: string[] };
export type LocationQuality = { distanceKm: number | null; accepted: boolean; reason: "WITHIN_AREA" | "OUTSIDE_AREA" | "MISSING_COORDINATES" | "ADDRESS_CONFLICT" };

// Operational sales search zones, not legal administrative boundaries. Tune deliberately after local manual validation.
export const searchAreas: Record<SearchBusinessesInput["location"], SearchArea> = {
  "Đà Lạt": { label: "Đà Lạt", center: { latitude: 11.94646, longitude: 108.44193 }, radiusMeters: 25_000, provinceTokens: ["lâm đồng", "lam dong"], localityTokens: ["đà lạt", "da lat"] },
  "Đức Trọng": { label: "Đức Trọng", center: { latitude: 11.69722, longitude: 108.31611 }, radiusMeters: 30_000, provinceTokens: ["lâm đồng", "lam dong"], localityTokens: ["đức trọng", "duc trong"] },
  "Lâm Hà": { label: "Lâm Hà", center: { latitude: 11.81554, longitude: 108.21444 }, radiusMeters: 35_000, provinceTokens: ["lâm đồng", "lam dong"], localityTokens: ["lâm hà", "lam ha"] },
  "Đơn Dương": { label: "Đơn Dương", center: { latitude: 11.7531, longitude: 108.554 }, radiusMeters: 30_000, provinceTokens: ["lâm đồng", "lam dong"], localityTokens: ["đơn dương", "don duong"] },
  "Di Linh": { label: "Di Linh", center: { latitude: 11.58165, longitude: 108.07633 }, radiusMeters: 35_000, provinceTokens: ["lâm đồng", "lam dong"], localityTokens: ["di linh"] },
  "Bảo Lộc": { label: "Bảo Lộc", center: { latitude: 11.54806, longitude: 107.8075 }, radiusMeters: 25_000, provinceTokens: ["lâm đồng", "lam dong"], localityTokens: ["bảo lộc", "bao loc"] },
  "Lạc Dương": { label: "Lạc Dương", center: { latitude: 12.00867, longitude: 108.41907 }, radiusMeters: 35_000, provinceTokens: ["lâm đồng", "lam dong"], localityTokens: ["lạc dương", "lac duong"] },
};

export const GEO_TOLERANCE_METERS = 5_000;
const conflictingRegionTokens = ["ha noi", "ho chi minh", "da nang", "hai phong", "can tho", "an giang", "ba ria", "vung tau", "bac giang", "bac kan", "bac lieu", "bac ninh", "ben tre", "binh dinh", "binh duong", "binh phuoc", "binh thuan", "ca mau", "cao bang", "dak lak", "dak nong", "dien bien", "dong nai", "dong thap", "gia lai", "ha giang", "ha nam", "ha tinh", "hai duong", "hau giang", "hoa binh", "hung yen", "khanh hoa", "kien giang", "kon tum", "lai chau", "lang son", "lao cai", "long an", "nam dinh", "nghe an", "ninh binh", "ninh thuan", "phu tho", "phu yen", "quang binh", "quang nam", "quang ngai", "quang ninh", "quang tri", "soc trang", "son la", "tay ninh", "thai binh", "thai nguyen", "thanh hoa", "thua thien hue", "tien giang", "tra vinh", "tuyen quang", "vinh long", "vinh phuc", "yen bai"];

const radians = (degrees: number) => degrees * Math.PI / 180;
export function deriveSearchViewport(area: Pick<SearchArea, "center" | "radiusMeters">): SearchViewport {
  const latitudeDelta = area.radiusMeters / 111_320;
  const longitudeDelta = area.radiusMeters / (111_320 * Math.cos(radians(area.center.latitude)));
  return {
    low: { latitude: area.center.latitude - latitudeDelta, longitude: area.center.longitude - longitudeDelta },
    high: { latitude: area.center.latitude + latitudeDelta, longitude: area.center.longitude + longitudeDelta },
  };
}
export function haversineKm(a: SearchArea["center"], b: SearchArea["center"]) {
  const earthKm = 6371; const latitude = radians(b.latitude - a.latitude); const longitude = radians(b.longitude - a.longitude);
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitude / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function normalized(value: string) { return value.toLocaleLowerCase("vi-VN").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d"); }
export function assessLocationQuality(area: SearchArea, coordinates: SearchArea["center"] | null, address: string | null): LocationQuality {
  const text = normalized(address || "");
  const addressConflict = conflictingRegionTokens.some((token) => text.includes(token)) && !area.provinceTokens.some((token) => text.includes(token));
  if (addressConflict) return { distanceKm: coordinates ? haversineKm(area.center, coordinates) : null, accepted: false, reason: "ADDRESS_CONFLICT" };
  if (!coordinates) {
    const local = area.localityTokens.some((token) => text.includes(token)) && area.provinceTokens.some((token) => text.includes(token));
    return { distanceKm: null, accepted: local, reason: "MISSING_COORDINATES" };
  }
  const distanceKm = haversineKm(area.center, coordinates); const accepted = distanceKm * 1000 <= area.radiusMeters + GEO_TOLERANCE_METERS;
  return { distanceKm: Math.round(distanceKm * 10) / 10, accepted, reason: accepted ? "WITHIN_AREA" : "OUTSIDE_AREA" };
}
