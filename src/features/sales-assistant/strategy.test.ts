import { describe, expect, it } from "vitest";
import { buildSalesStrategy } from "./strategy";
import type { OpportunityResult } from "../opportunities/types";
import type { PriorityScoreResult } from "../priority-score/types";

const priority = (band: PriorityScoreResult["band"] = "LOW"): PriorityScoreResult => ({ total: band === "LOW" ? 20 : 50, band, contactability: 10, opportunity: 10, readiness: 0, reasons: [], opportunityIncomplete: false });
const result = (opportunities: OpportunityResult["opportunities"]): OpportunityResult => ({ opportunities, contactReasons: [], auditLimited: false });
const opportunity = (type: OpportunityResult["opportunities"][number]["type"], evidence = "Bằng chứng đã xác minh."): OpportunityResult["opportunities"][number] => ({ type, severity: "MEDIUM", title: type, reason: evidence, suggestedService: "Dịch vụ", evidenceCodes: [type], evidence: [evidence] });

describe("deterministic sales strategy", () => {
  it("classifies a social-only lodging lead as WEBSITE_OPPORTUNITY", () => { const strategy = buildSalesStrategy({ stage: "NEW", industry: "Homestay", websiteUrl: "https://facebook.com/mayhomestay" }, result([opportunity("NO_WEBSITE")]), priority()); expect(strategy.recommendation).toBe("WEBSITE_OPPORTUNITY"); expect(strategy.primaryAngle).toContain("Giữ kênh mạng xã hội"); });
  it("optimizes an existing website with CTA issues instead of rebuilding", () => { const strategy = buildSalesStrategy({ stage: "NEW", industry: "Khách sạn", websiteUrl: "https://hotel.example" }, result([opportunity("CONTACT_CONVERSION")]), priority("WARM")); expect(strategy.recommendation).toBe("OPTIMIZE_EXISTING"); expect(strategy.primaryAngle).toContain("chưa có cơ sở để đề nghị xây lại"); });
  it("does not manufacture a pitch for a weak lead", () => { expect(buildSalesStrategy({ stage: "NEW", industry: "Spa", websiteUrl: "https://spa.example" }, result([]), priority()).recommendation).toBe("LOW_PRIORITY"); });
  it.each(["WON", "LOST"] as const)("closes a %s lead", (stage) => { expect(buildSalesStrategy({ stage, industry: null, websiteUrl: null }, result([]), priority()).recommendation).toBe("CLOSED"); });
});
