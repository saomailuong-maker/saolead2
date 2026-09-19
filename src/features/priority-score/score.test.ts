import { describe, expect, it } from "vitest";
import type { OpportunityResult, OpportunityType } from "../opportunities/types";
import { calculatePriorityScore, priorityBand, sortByPriority } from "./score";

const result = (...types: OpportunityType[]): OpportunityResult => ({ opportunities: types.map((type) => ({ type, severity: "MEDIUM", title: type, reason: type, suggestedService: type, evidenceCodes: [type], evidence: [type] })), contactReasons: [], auditLimited: false });
const lead = { phone: null, websiteUrl: null, email: null, facebookUrl: null, instagramUrl: null, zaloUrl: null, stage: "NEW" as const };
const score = (overrides = {}, opportunities = result(), hasSuccessfulAudit = true) => calculatePriorityScore({ lead: { ...lead, ...overrides }, opportunityResult: opportunities, hasSuccessfulAudit });

describe("priority score", () => {
  it("awards contactability points and caps them at 25", () => { const value = score({ phone: "1", websiteUrl: "https://example.com", email: "a@example.com", facebookUrl: "https://facebook.com/a" }); expect(value.contactability).toBe(25); expect(value.reasons.filter((reason) => reason.group === "CONTACTABILITY").map((reason) => reason.points)).toEqual([12, 5, 5, 3]); });
  it("scores opportunity types, combines them and caps at 50", () => { expect(score({}, result("NO_WEBSITE")).opportunity).toBe(30); expect(score({}, result("NO_WEBSITE", "CONTACT_CONVERSION", "DIRECT_BOOKING")).opportunity).toBe(50); });
  it("does not score a duplicate opportunity type twice", () => { expect(score({}, result("SEO_FOUNDATION", "SEO_FOUNDATION")).opportunity).toBe(8); });
  it.each([["NEW", 0], ["QUALIFIED", 5], ["REPLIED", 15], ["INTERESTED", 20], ["NEGOTIATION", 25]] as const)("scores %s readiness", (stage, points) => { expect(score({ stage }).readiness).toBe(points); });
  it.each(["WON", "LOST"] as const)("marks %s as closed", (stage) => { expect(score({ stage })).toMatchObject({ total: 0, band: "CLOSED", reasons: [] }); });
  it.each([[70, "HOT"], [69, "WARM"], [45, "WARM"], [44, "LOW"]] as const)("maps %s to %s", (total, band) => { expect(priorityBand(total)).toBe(band); });
  it("keeps total equal to displayed groups and every award explainable", () => { const value = score({ phone: "1", stage: "QUALIFIED" }, result("NO_WEBSITE")); expect(value.total).toBe(value.contactability + value.opportunity + value.readiness); expect(value.reasons.every((reason) => reason.points > 0 && reason.label)).toBeTruthy(); });
  it("does not invent opportunity points when audit is missing", () => { const value = score({ websiteUrl: "https://example.com" }, result(), false); expect(value.opportunity).toBe(0); expect(value.opportunityIncomplete).toBe(true); });
  it("sorts dynamic scores high to low", () => { const low = score(); const high = score({ phone: "1" }, result("NO_WEBSITE")); expect(sortByPriority([{ id: "low", score: low, updatedAt: new Date(1) }, { id: "high", score: high, updatedAt: new Date(0) }]).map((item) => item.id)).toEqual(["high", "low"]); });
  it("counts a social URL as social contact but not as a standalone website", () => { const value = score({ websiteUrl: "https://instagram.com/example" }, result("NO_WEBSITE"), false); expect(value.contactability).toBe(3); expect(value.reasons).toEqual(expect.arrayContaining([expect.objectContaining({ code: "CONTACT_SOCIAL", points: 3 })])); expect(value.reasons.some((reason) => reason.code === "CONTACT_WEBSITE")).toBe(false); expect(value.opportunityIncomplete).toBe(false); });
  it("continues to award standalone website points", () => { const value = score({ websiteUrl: "https://example.com" }); expect(value.contactability).toBe(5); expect(value.reasons).toEqual(expect.arrayContaining([expect.objectContaining({ code: "CONTACT_WEBSITE", points: 5 })])); });
});
