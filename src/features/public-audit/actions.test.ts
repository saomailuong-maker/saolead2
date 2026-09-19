import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findLead: vi.fn(), createReport: vi.fn(), createActivity: vi.fn(), updateReports: vi.fn(), findReport: vi.fn(), transaction: vi.fn(), openAI: vi.fn() }));
vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1", user: { id: "user-1" } }) }));
vi.mock("../../lib/db", () => ({ db: { lead: { findFirst: mocks.findLead }, publicAuditReport: { updateMany: mocks.updateReports, findFirst: mocks.findReport }, activity: { create: mocks.createActivity }, $transaction: mocks.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("../opportunities/engine", () => ({ generateOpportunities: () => ({ opportunities: [], contactReasons: [], auditLimited: false }) }));
vi.mock("../priority-score/score", () => ({ calculatePriorityScore: () => ({ total: 10, band: "LOW", contactability: 0, opportunity: 0, readiness: 0, reasons: [], opportunityIncomplete: false }) }));
vi.mock("../sales-assistant/strategy", () => ({ buildSalesStrategy: () => ({ recommendation: "WEBSITE_OPPORTUNITY", confidence: "LOW", primaryAngle: "", supportingEvidence: [], risks: [], discoveryQuestions: [], allowedClaims: [], prohibitedClaims: [] }) }));
vi.mock("./snapshot", () => ({ buildPublicAuditSnapshot: () => ({ version: 1, business: { name: "Mây" }, reportType: "SOCIAL_ONLY", summary: { headline: "H", intro: "I" }, observations: [], opportunities: [], recommendations: [], cta: { title: "T", detail: "D" }, generatedAt: "2026-09-19T00:00:00.000Z" }) }));
vi.mock("./security", () => ({ createPublicToken: () => "a".repeat(43) }));
vi.mock("../sales-assistant/openai", () => ({ generateDraftWithOpenAI: mocks.openAI }));
import { createPublicAuditReport, revokePublicAuditReport } from "./actions";

describe("public report admin actions", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findLead.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000001", websiteScans: [] }); mocks.transaction.mockImplementation(async (callback) => callback({ publicAuditReport: { create: mocks.createReport }, activity: { create: mocks.createActivity } })); });
  it("creates only within the current workspace and makes zero OpenAI calls", async () => { const form = new FormData(); form.set("leadId", "00000000-0000-4000-8000-000000000001"); await expect(createPublicAuditReport(form)).rejects.toThrow("report=created"); expect(mocks.findLead).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ workspaceId: "workspace-1" }) })); expect(mocks.createReport).toHaveBeenCalledOnce(); expect(mocks.openAI).not.toHaveBeenCalled(); expect(mocks.createActivity).toHaveBeenCalledWith({ data: expect.objectContaining({ type: "NOTE" }) }); });
  it("revokes only a report owned by the current workspace", async () => { const form = new FormData(); form.set("leadId", "00000000-0000-4000-8000-000000000001"); form.set("reportId", "00000000-0000-4000-8000-000000000002"); await expect(revokePublicAuditReport(form)).rejects.toThrow("report=revoked"); expect(mocks.updateReports).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ workspaceId: "workspace-1", leadId: "00000000-0000-4000-8000-000000000001" }) })); });
});
