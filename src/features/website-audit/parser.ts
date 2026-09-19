import * as cheerio from "cheerio";
import type { AuditChecks } from "./types";

const CTA_TERMS = ["liên hệ", "gọi ngay", "zalo", "đặt phòng", "đặt bàn", "đặt lịch", "nhận báo giá", "tư vấn", "mua ngay", "đăng ký", "xem phòng", "book now", "contact", "call"];
const SECTION_TERMS: Record<keyof AuditChecks["structure"], string[]> = {
  about: ["giới thiệu", "about"], services: ["dịch vụ", "services"], products: ["sản phẩm", "products"], contact: ["liên hệ", "contact"],
  blog: ["tin tức", "blog", "news"], faq: ["faq", "câu hỏi thường gặp"], portfolio: ["portfolio", "dự án"], booking: ["booking", "đặt phòng"],
};

const concise = (value: string | undefined, max = 500) => value?.replace(/\s+/g, " ").trim().slice(0, max) || null;

export function parseHomepage(html: string) {
  const $ = cheerio.load(html);
  const links = $("a[href]").map((_, element) => ({ href: String($(element).attr("href") || "").toLowerCase(), text: $(element).text().replace(/\s+/g, " ").trim().toLowerCase() })).get();
  const searchableLinks = links.map((link) => `${link.text} ${link.href}`);
  const pageText = $("body").text().replace(/\s+/g, " ").toLowerCase();
  const matchesLink = (patterns: string[]) => searchableLinks.some((value) => patterns.some((pattern) => value.includes(pattern)));
  const ctas = CTA_TERMS.filter((term) => pageText.includes(term));
  return {
    seo: {
      title: concise($("title").first().text()), description: concise($('meta[name="description" i]').attr("content")), viewport: concise($('meta[name="viewport" i]').attr("content")),
      canonical: concise($('link[rel~="canonical" i]').attr("href")), lang: concise($("html").attr("lang"), 50), h1Count: $("h1").length,
      openGraphTitle: concise($('meta[property="og:title" i]').attr("content")), openGraphDescription: concise($('meta[property="og:description" i]').attr("content")),
      favicon: concise($('link[rel~="icon" i]').first().attr("href")), robots: concise($('meta[name="robots" i]').attr("content")),
    },
    contact: {
      telLinks: links.filter(({ href }) => href.startsWith("tel:")).length, mailtoLinks: links.filter(({ href }) => href.startsWith("mailto:")).length, forms: $("form").length,
      zalo: matchesLink(["zalo.me", "zalo"]), messenger: matchesLink(["m.me/", "messenger.com"]), whatsapp: matchesLink(["wa.me/", "whatsapp.com"]),
      facebook: matchesLink(["facebook.com", "fb.com"]), instagram: matchesLink(["instagram.com"]), ctas,
    },
    structure: Object.fromEntries(Object.entries(SECTION_TERMS).map(([key, terms]) => [key, matchesLink(terms)])) as AuditChecks["structure"],
  };
}
