import { describe, expect, it } from "vitest";
import { buildTextQuery, searchInputSchema } from "./query";
describe("discovery input", () => {
  it("builds a deterministic local query", () => { expect(buildTextQuery(searchInputSchema.parse({ location: "Đà Lạt", industry: "Homestay", keyword: "villa", maxResults: 20 }))).toBe("homestay villa in Đà Lạt, Lâm Đồng, Việt Nam"); });
  it("rejects unsupported locations and oversized searches", () => { expect(searchInputSchema.safeParse({ location: "Hà Nội", industry: "Homestay", maxResults: 20 }).success).toBe(false); expect(searchInputSchema.safeParse({ location: "Đà Lạt", industry: "Homestay", maxResults: 100 }).success).toBe(false); });
});
