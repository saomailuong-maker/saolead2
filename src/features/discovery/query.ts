import { z } from "zod";

export const locations = ["Đức Trọng", "Đà Lạt", "Lâm Hà", "Đơn Dương", "Di Linh", "Bảo Lộc", "Lạc Dương"] as const;
export const industries = ["Homestay", "Khách sạn", "Cafe", "Nhà hàng", "Du lịch / Tour", "Farm / Nông nghiệp", "Cửa hàng nông nghiệp", "Xây dựng", "Nội thất", "Spa", "Nha khoa / Phòng khám", "Bất động sản"] as const;

export const searchInputSchema = z.object({
  location: z.enum(locations),
  industry: z.enum(industries),
  keyword: z.string().trim().max(80).regex(/^[\p{L}\p{N}\s.,/-]*$/u).default(""),
  maxResults: z.coerce.number().refine((n) => [10, 20].includes(n)),
});

export type SearchBusinessesInput = z.infer<typeof searchInputSchema>;
const terms: Record<(typeof industries)[number], string> = {
  "Homestay": "homestay", "Khách sạn": "khách sạn", "Cafe": "quán cafe", "Nhà hàng": "nhà hàng", "Du lịch / Tour": "tour du lịch", "Farm / Nông nghiệp": "farm nông nghiệp", "Cửa hàng nông nghiệp": "cửa hàng vật tư nông nghiệp", "Xây dựng": "công ty xây dựng", "Nội thất": "công ty nội thất", "Spa": "spa", "Nha khoa / Phòng khám": "nha khoa phòng khám", "Bất động sản": "bất động sản",
};

export function buildTextQuery(input: SearchBusinessesInput) {
  return `${terms[input.industry]}${input.keyword ? ` ${input.keyword}` : ""} ${input.location}`;
}
