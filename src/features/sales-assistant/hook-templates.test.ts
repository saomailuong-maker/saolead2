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
    expect(msg).toContain("tối ưu vị trí hiển thị khi khách tìm kiếm trên Google");
    expect(msg).toContain("landing page");
  });

  it("builds 3DUA Media comprehensive marketing hook message", () => {
    const msg = HOOK_TEMPLATES.COMPREHENSIVE_MARKETING.build({ businessName: "Tiệm Cà Phê Mây", location: "Đà Lạt" });
    expect(msg).toContain("3DUA Media");
    expect(msg).toContain("Tiệm Cà Phê Mây");
    expect(msg).toContain("Đà Lạt");
    expect(msg).toContain("Marketing toàn diện");
  });
});
