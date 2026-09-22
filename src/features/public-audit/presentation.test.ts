import{describe,expect,it}from"vitest";import{buildReportNarrative}from"./presentation";
const base={version:1 as const,summary:{headline:"Tóm tắt",intro:"Giới thiệu"},observations:[{title:"CTA chưa rõ",detail:"Chưa thấy hành động chính."}],opportunities:[],recommendations:[{title:"Làm rõ CTA",detail:"Chọn hành động ưu tiên."}],cta:{title:"Trao đổi",detail:"Nếu phù hợp"},generatedAt:"2026-09-19T00:00:00.000Z"};
describe("report narrative", () => {
  it("uses a lodging playbook and starts with strengths", () => {
    const n = buildReportNarrative({ ...base, business: { name: "Nhà Mây", industry: "Homestay", location: "Đà Lạt" }, reportType: "SOCIAL_ONLY" });
    expect(n.industry).toBe("LODGING");
    expect(n.currentStrengths[0].title).toContain("Đã có");
    expect(n.valueHypotheses.some((x) => /lưu trú|hỏi phòng/.test(`${x.title} ${x.detail}`))).toBe(true);
    expect(n.customerJourney).toContain("Website / landing page");
  });

  it("computes a valid digital health scorecard with 4 pillars", () => {
    const n = buildReportNarrative({ ...base, business: { name: "Nhà Mây", industry: "Homestay", location: "Đà Lạt" }, reportType: "SOCIAL_ONLY" });
    expect(n.scorecard.pillars).toHaveLength(4);
    expect(n.scorecard.overallScore).toBeGreaterThan(0);
    expect(n.scorecard.overallScore).toBeLessThanOrEqual(100);
    expect(["STRONG", "FAIR", "DEVELOPING"]).toContain(n.scorecard.overallBand);
  });

  it("provides lodging-specific before vs after and cost of inaction", () => {
    const n = buildReportNarrative({ ...base, business: { name: "Nhà Mây", industry: "Homestay", location: "Đà Lạt" }, reportType: "SOCIAL_ONLY" });
    expect(n.beforeVsAfter.length).toBeGreaterThanOrEqual(3);
    expect(JSON.stringify(n.beforeVsAfter)).toContain("phòng");
    expect(n.costOfInaction.bulletPoints.length).toBeGreaterThanOrEqual(2);
    expect(n.costOfInaction.bulletPoints.some((b) => /inbox|Facebook|Maps/i.test(b))).toBe(true);
  });

  it("generates a valid pre-filled Zalo consultation link", () => {
    const n = buildReportNarrative({ ...base, business: { name: "Nhà Mây", industry: "Homestay", location: "Đà Lạt" }, reportType: "SOCIAL_ONLY" });
    expect(n.zaloConsultation.zaloHref).toContain("zalo.me");
    expect(decodeURIComponent(n.zaloConsultation.zaloHref)).toContain("Nhà Mây");
  });

  it("keeps construction copy free of lodging language", () => {
    const n = buildReportNarrative({ ...base, business: { name: "An Phát", industry: "Xây dựng" }, reportType: "SOCIAL_ONLY" });
    expect(n.industry).toBe("CONSTRUCTION_LOCAL_SERVICE");
    expect(JSON.stringify(n.valueHypotheses)).not.toMatch(/phòng|booking|lưu trú/i);
    expect(JSON.stringify(n.valueHypotheses)).toMatch(/dịch vụ|báo giá/i);
  });

  it("does not tell an existing website that it has no website", () => {
    const n = buildReportNarrative({ ...base, business: { name: "An Phát", industry: "Xây dựng", website: "https://anphat.vn" }, reportType: "WEBSITE_AUDIT" });
    expect(JSON.stringify(n)).not.toContain("Chưa phát hiện website riêng");
    expect(n.headline).toContain("đã có website");
  });

  it("uses capability language without guarantees", () => {
    const n = buildReportNarrative({ ...base, business: { name: "Mây", industry: "Cafe" }, reportType: "SOCIAL_ONLY" });
    expect(JSON.stringify(n.valueHypotheses)).not.toMatch(/tăng doanh thu|tăng booking|lên top|đảm bảo/i);
  });

  it("differentiates lodging segments: homestay vs hotel vs villa", () => {
    // Crucial real-world test: "Vũ Homestay" labeled as "Khách sạn" by Google Places must detect as HOMESTAY
    const vuHomestay = buildReportNarrative({ ...base, business: { name: "Vũ Homestay", industry: "Khách sạn" }, reportType: "SOCIAL_ONLY" });
    expect(vuHomestay.lodgingSegment).toBe("HOMESTAY");
    expect(vuHomestay.costOfInaction.headline).toContain("inbox");
    expect(vuHomestay.costOfInaction.bulletPoints.some((b) => /OTA/i.test(b))).toBe(false);

    const hotel = buildReportNarrative({ ...base, business: { name: "Dalat Palace Hotel", industry: "Khách sạn" }, reportType: "SOCIAL_ONLY" });
    expect(hotel.lodgingSegment).toBe("HOTEL");
    expect(hotel.costOfInaction.headline).toContain("Direct Booking");
    expect(hotel.costOfInaction.bulletPoints.some((b) => /OTA/i.test(b))).toBe(true);

    const villa = buildReportNarrative({ ...base, business: { name: "Bình An Villa", industry: "Khách sạn" }, reportType: "SOCIAL_ONLY" });
    expect(villa.lodgingSegment).toBe("VILLA");
    expect(villa.costOfInaction.headline).toContain("khách đoàn");
  });
});

