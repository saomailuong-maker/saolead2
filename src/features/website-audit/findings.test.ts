import { describe, expect, it } from "vitest";
import { generateFindings } from "./findings";
import type { AuditChecks } from "./types";

describe("deterministic website findings", () => {
  it("reports protocol, SEO and conversion gaps", () => {
    const checks: AuditChecks = { reachability: { requestedUrl: "http://example.com", finalUrl: "http://example.com/", httpStatus: 200, redirectCount: 0, https: false, durationMs: 10, contentType: "text/html" }, seo: { title: "Example", description: null, viewport: null, canonical: null, lang: null, h1Count: 1, openGraphTitle: null, openGraphDescription: null, favicon: null, robots: null }, contact: { telLinks: 0, mailtoLinks: 0, forms: 0, zalo: false, messenger: false, whatsapp: false, facebook: false, instagram: false, ctas: [] }, structure: { about: false, services: false, products: false, contact: false, blog: false, faq: false, portfolio: false, booking: false } };
    const findings = generateFindings(checks);
    expect(findings).toEqual(expect.arrayContaining([expect.objectContaining({ severity: "HIGH", code: "NO_HTTPS" }), expect.objectContaining({ code: "MISSING_META_DESCRIPTION" }), expect.objectContaining({ code: "MISSING_VIEWPORT" }), expect.objectContaining({ code: "MISSING_CONTACT_CTA" }), expect.objectContaining({ code: "MISSING_CLICK_TO_CALL" }), expect.objectContaining({ code: "MISSING_CANONICAL" })]));
  });
});
