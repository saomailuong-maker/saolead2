import { describe, expect, it } from "vitest";
import { getDefaultHookTemplate, HOOK_TEMPLATES } from "./hook-templates";

describe("hook-templates", () => {
  it("determines correct default template by industry", () => {
    expect(getDefaultHookTemplate("Homestay Đà Lạt")).toBe("HOMESTAY_DIRECT");
    expect(getDefaultHookTemplate("Khách sạn 3 sao")).toBe("HOTEL_MAPS");
    expect(getDefaultHookTemplate("Quán Cafe View")).toBe("LOCAL_SERVICE");
    expect(getDefaultHookTemplate("Khác")).toBe("SHORT_3LINES");
  });

  it("builds personalized hook message with business name", () => {
    const msg = HOOK_TEMPLATES.HOMESTAY_DIRECT.build({ businessName: "Mây Homestay" });
    expect(msg).toContain("Mây Homestay");
    expect(msg).toContain("Google Maps");
    expect(msg).toContain("15-20%");
  });

  it("builds hotel hook message with location", () => {
    const msg = HOOK_TEMPLATES.HOTEL_MAPS.build({ businessName: "Khách Sạn Mai Vàng", location: "Đà Lạt" });
    expect(msg).toContain("Khách Sạn Mai Vàng");
    expect(msg).toContain("Đà Lạt");
    expect(msg).toContain("Top 3 Google Maps");
  });
});
