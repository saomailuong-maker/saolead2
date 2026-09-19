import { describe, expect, it } from "vitest";
import { buildVerifiedContext } from "./context";

describe("verified AI context", () => {
  it("contains compact evidence without secrets, contact values, logs or HTML", () => {
    const lead = { businessName: "Mây Homestay", industry: "Homestay", locationText: "Đà Lạt", stage: "NEW", websiteUrl: "https://facebook.com/may", phone: "0900-secret", email: "private@example.com", facebookUrl: null, instagramUrl: null, zaloUrl: null, apiKey: "sk-secret", rawHtml: "<html>secret page</html>" };
    const priority = { total: 30, band: "LOW" as const, contactability: 15, opportunity: 15, readiness: 0, reasons: [], opportunityIncomplete: false };
    const opportunities = { opportunities: [], contactReasons: [], auditLimited: false };
    const strategy = { recommendation: "WEBSITE_OPPORTUNITY" as const, confidence: "MEDIUM" as const, primaryAngle: "Owned destination", supportingEvidence: [], risks: [], discoveryQuestions: [], allowedClaims: [], prohibitedClaims: [] };
    const serialized = JSON.stringify(buildVerifiedContext(lead, priority, opportunities, strategy, null));
    expect(serialized).not.toContain("0900-secret"); expect(serialized).not.toContain("private@example.com"); expect(serialized).not.toContain("sk-secret"); expect(serialized).not.toContain("<html>");
  });
});
