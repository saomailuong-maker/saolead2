import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildDemoBrief, buildDemoContent, decideDemo, type DemoLead } from "./brief";
import { DemoRenderer } from "./render";
import type { OpportunityResult } from "../opportunities/types";
import type { PriorityScoreResult } from "../priority-score/types";
import type { SalesStrategy } from "../sales-assistant/types";

const lead: DemoLead = {
  id: "00000000-0000-4000-8000-000000000001",
  businessName: "Nhà Mây",
  industry: "Homestay",
  locationText: "Đà Lạt",
  websiteUrl: "https://facebook.com/nhamay",
  phone: "0912345678",
  zaloUrl: null,
  facebookUrl: "https://facebook.com/nhamay",
};

const opportunities: OpportunityResult = {
  opportunities: [
    {
      type: "NO_WEBSITE",
      severity: "HIGH",
      title: "Chưa có website",
      reason: "Chưa có website riêng",
      suggestedService: "Website",
      evidenceCodes: ["NO_STANDALONE_WEBSITE"],
      evidence: ["CRM chưa ghi nhận website riêng."],
    },
  ],
  contactReasons: [],
  auditLimited: false,
};

const priority = (band: PriorityScoreResult["band"]): PriorityScoreResult => ({
  total: band === "LOW" ? 10 : 60,
  band,
  contactability: 10,
  opportunity: 30,
  readiness: 20,
  reasons: [],
  opportunityIncomplete: false,
});

const strategy = (recommendation: SalesStrategy["recommendation"]): SalesStrategy => ({
  recommendation,
  confidence: "HIGH",
  primaryAngle: "",
  supportingEvidence: [],
  risks: [],
  discoveryQuestions: [],
  allowedClaims: [],
  prohibitedClaims: [],
});

describe("personalized demo", () => {
  it("chooses ONE_PAGE for social-only lodging", () =>
    expect(
      decideDemo({
        lead,
        opportunityResult: opportunities,
        priority: priority("WARM"),
        strategy: strategy("WEBSITE_OPPORTUNITY"),
      }).type
    ).toBe("ONE_PAGE"));

  it("chooses OPTIMIZATION_MOCKUP for an existing website with CTA issues", () => {
    const existing = { ...lead, websiteUrl: "https://nhamay.vn" };
    const result = {
      ...opportunities,
      opportunities: [{ ...opportunities.opportunities[0], type: "CLICK_TO_CALL" as const }],
    };
    expect(
      decideDemo({
        lead: existing,
        opportunityResult: result,
        priority: priority("WARM"),
        strategy: strategy("OPTIMIZE_EXISTING"),
      }).type
    ).toBe("OPTIMIZATION_MOCKUP");
  });

  it("returns NONE for LOW priority", () =>
    expect(
      decideDemo({
        lead,
        opportunityResult: opportunities,
        priority: priority("LOW"),
        strategy: strategy("WEBSITE_OPPORTUNITY"),
      }).type
    ).toBe("NONE"));

  it("chooses BOOKING_FLOW only after booking need is confirmed", () =>
    expect(
      decideDemo({
        lead,
        opportunityResult: opportunities,
        priority: priority("HOT"),
        strategy: strategy("WEBSITE_OPPORTUNITY"),
        confirmedBookingNeed: true,
      }).type
    ).toBe("BOOKING_FLOW"));

  it("renders structured safe content, presets and explicit CTAs", () => {
    const brief = buildDemoBrief(lead, "ONE_PAGE", opportunities);
    const content = buildDemoContent(brief);
    const warm = renderToStaticMarkup(<DemoRenderer brief={brief} content={content} preset="WARM_HOSPITALITY" />);
    const dark = renderToStaticMarkup(<DemoRenderer brief={brief} content={content} preset="PREMIUM_DARK" />);
    expect(warm).toContain('data-preset="WARM_HOSPITALITY"');
    expect(dark).toContain('data-preset="PREMIUM_DARK"');
    expect(warm).toContain("Nhà Mây");
    expect(warm).toContain("Nội dung có thể điều chỉnh");
    expect(warm).toContain("Không gian, dịch vụ và trải nghiệm");
    expect(warm).toContain("data-mobile-sticky-cta");
    expect(warm).not.toContain("CRM");
    expect(JSON.stringify({ brief, content })).not.toMatch(/API_KEY|provider|notes/i);
  });

  it("marks a persisted concept image as illustrative", () => {
    const brief = buildDemoBrief(lead, "ONE_PAGE", opportunities);
    const html = renderToStaticMarkup(
      <DemoRenderer
        brief={brief}
        content={buildDemoContent(brief)}
        preset="WARM_HOSPITALITY"
        conceptImagePath="/generated/demo-concepts/example.webp"
      />
    );
    expect(html).toContain("example.webp");
    expect(html).toContain("Hình minh họa concept");
  });

  it("renders interactive lodging booking widget and Google Maps section for hospitality leads", () => {
    const brief = buildDemoBrief(lead, "ONE_PAGE", opportunities);
    const content = buildDemoContent(brief);
    const html = renderToStaticMarkup(
      <DemoRenderer brief={brief} content={content} preset="WARM_HOSPITALITY" reportHref="/r/test-token" />
    );
    expect(html).toContain("booking-widget");
    expect(html).toContain("demo-location");
    expect(html).toContain("Chỉ đường Google Maps");
    expect(html).toContain("Khung iPhone 16");
    expect(html).toContain("Xem lại Báo cáo");
  });

  it("tailors room showcase and pricing models by lodging segment (homestay vs hotel vs villa)", () => {
    // Homestay: Vũ Homestay with Google Maps category "Khách sạn"
    const homestayLead = { ...lead, businessName: "Vũ Homestay", industry: "Khách sạn" };
    const homestayBrief = buildDemoBrief(homestayLead, "ONE_PAGE", opportunities);
    const homestayHtml = renderToStaticMarkup(
      <DemoRenderer brief={homestayBrief} content={buildDemoContent(homestayBrief)} preset="WARM_HOSPITALITY" />
    );
    expect(homestayHtml).toContain("Phòng Áp Mái Hoàng Hôn");
    expect(homestayHtml).toContain("Thuê xe máy tận phòng");
    expect(homestayHtml).toContain("Niêm yết:");
    expect(homestayHtml).not.toContain("Sàn OTA:");

    // Hotel: Dalat Palace Hotel
    const hotelLead = { ...lead, businessName: "Dalat Palace Hotel", industry: "Khách sạn" };
    const hotelBrief = buildDemoBrief(hotelLead, "ONE_PAGE", opportunities);
    const hotelHtml = renderToStaticMarkup(
      <DemoRenderer brief={hotelBrief} content={buildDemoContent(hotelBrief)} preset="WARM_HOSPITALITY" />
    );
    expect(hotelHtml).toContain("Phòng Superior Tiêu Chuẩn");
    expect(hotelHtml).toContain("Lễ tân &amp; Bảo vệ 24/7");
    expect(hotelHtml).toContain("Sàn OTA:");

    // Villa: Bình An Villa
    const villaLead = { ...lead, businessName: "Bình An Villa", industry: "Khách sạn" };
    const villaBrief = buildDemoBrief(villaLead, "ONE_PAGE", opportunities);
    const villaHtml = renderToStaticMarkup(
      <DemoRenderer brief={villaBrief} content={buildDemoContent(villaBrief)} preset="WARM_HOSPITALITY" />
    );
    expect(villaHtml).toContain("Thuê Trọn Căn 3 Phòng Ngủ");
    expect(villaHtml).toContain("Bida &amp; Phòng Karaoke");
    expect(villaHtml).toContain("Tiêu chuẩn:");
  });

  it("does not invent prices, amenities or availability", () => {
    const json = JSON.stringify(buildDemoContent(buildDemoBrief(lead, "BOOKING_FLOW", opportunities)));
    expect(json).not.toMatch(/₫|triệu|wifi|hồ bơi|còn phòng/i);
    expect(json).toContain("không phải tồn phòng thực tế");
  });
});
