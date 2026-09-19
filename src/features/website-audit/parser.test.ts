import { describe, expect, it } from "vitest";
import { parseHomepage } from "./parser";

describe("homepage parser", () => {
  it("extracts SEO, contact, CTA, social and structure signals", () => {
    const parsed = parseHomepage(`<!doctype html><html lang="vi"><head><title>Mây Homestay</title><meta name="description" content="Nơi nghỉ tại Đà Lạt"><meta name="viewport" content="width=device-width"><meta property="og:title" content="Mây"><meta property="og:description" content="Đặt phòng"><meta name="robots" content="index,follow"><link rel="canonical" href="https://example.com/"><link rel="icon" href="/favicon.ico"></head><body><h1>Mây</h1><form></form><a href="tel:0912">Gọi ngay</a><a href="mailto:a@example.com">Email</a><a href="https://zalo.me/1">Zalo</a><a href="https://m.me/may">Messenger</a><a href="https://wa.me/1">WhatsApp</a><a href="https://facebook.com/may">Facebook</a><a href="https://instagram.com/may">Instagram</a><a href="/gioi-thieu">Giới thiệu</a><a href="/dich-vu">Dịch vụ</a><a href="/san-pham">Sản phẩm</a><a href="/lien-he">Liên hệ</a><a href="/blog">Tin tức</a><a href="/faq">FAQ</a><a href="/du-an">Dự án</a><a href="/booking">Đặt phòng</a></body></html>`);
    expect(parsed.seo).toMatchObject({ title: "Mây Homestay", description: "Nơi nghỉ tại Đà Lạt", viewport: "width=device-width", canonical: "https://example.com/", lang: "vi", h1Count: 1, openGraphTitle: "Mây", openGraphDescription: "Đặt phòng", favicon: "/favicon.ico", robots: "index,follow" });
    expect(parsed.contact).toMatchObject({ telLinks: 1, mailtoLinks: 1, forms: 1, zalo: true, messenger: true, whatsapp: true, facebook: true, instagram: true });
    expect(parsed.contact.ctas).toEqual(expect.arrayContaining(["gọi ngay", "đặt phòng", "liên hệ"]));
    expect(Object.values(parsed.structure).every(Boolean)).toBe(true);
  });
});
