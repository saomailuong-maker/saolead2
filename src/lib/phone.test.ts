import { describe, expect, it } from "vitest";
import { classifyPhoneNumber, getZaloDirectUrl, normalizePhoneNumber } from "./phone";

describe("phone classification utilities", () => {
  it("normalizes international +84 and local formats", () => {
    expect(normalizePhoneNumber("+84 912 345 678")).toBe("0912345678");
    expect(normalizePhoneNumber("84912345678")).toBe("0912345678");
    expect(normalizePhoneNumber("(0263) 3822-111")).toBe("02633822111");
    expect(normalizePhoneNumber("")).toBe("");
    expect(normalizePhoneNumber(null)).toBe("");
  });

  it("classifies mobile numbers as Zalo supported", () => {
    const res1 = classifyPhoneNumber("0912345678");
    expect(res1.type).toBe("MOBILE");
    expect(res1.isZaloSupported).toBe(true);

    const res2 = classifyPhoneNumber("+84 35 123 4567");
    expect(res2.type).toBe("MOBILE");
    expect(res2.isZaloSupported).toBe(true);
  });

  it("classifies 0263 as Lâm Đồng landline without Zalo", () => {
    const res = classifyPhoneNumber("0263 3822 111");
    expect(res.type).toBe("LANDLINE");
    expect(res.isZaloSupported).toBe(false);
    expect(res.provinceName).toBe("Lâm Đồng");
    expect(res.receptionistScript).toBeDefined();
  });

  it("classifies 024 and 028 as Hanoi and HCM landlines", () => {
    const hanoi = classifyPhoneNumber("024 3822 1122");
    expect(hanoi.provinceName).toBe("Hà Nội");
    expect(hanoi.isZaloSupported).toBe(false);

    const hcm = classifyPhoneNumber("028 3930 1234");
    expect(hcm.provinceName).toBe("TP. Hồ Chí Minh");
    expect(hcm.isZaloSupported).toBe(false);
  });

  it("classifies 0258 as Khánh Hòa landline", () => {
    const res = classifyPhoneNumber("0258 352 1234");
    expect(res.type).toBe("LANDLINE");
    expect(res.provinceName).toBe("Khánh Hòa");
  });

  it("classifies 1800/1900 as hotline", () => {
    const res = classifyPhoneNumber("1900 1234");
    expect(res.type).toBe("HOTLINE");
    expect(res.isZaloSupported).toBe(false);
  });

  it("handles empty or null phone", () => {
    const res = classifyPhoneNumber(null);
    expect(res.type).toBe("NONE");
    expect(res.isZaloSupported).toBe(false);
  });

  it("returns zalo direct URL only for mobile numbers", () => {
    expect(getZaloDirectUrl("0912345678", "Xin chao")).toContain("https://zalo.me/0912345678?text=Xin%20chao");
    expect(getZaloDirectUrl("0263 3822 111")).toBeNull();
    expect(getZaloDirectUrl(null)).toBeNull();
  });
});
