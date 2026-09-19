import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findLead: vi.fn(), createDraft: vi.fn(), generate: vi.fn() }));
vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1", user: { id: "user-1" } }) }));
vi.mock("../../lib/db", () => ({ db: { lead: { findFirst: mocks.findLead }, outreachDraft: { create: mocks.createDraft, findFirst: vi.fn(), updateMany: vi.fn() } } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("./openai", () => ({ generateDraftWithOpenAI: mocks.generate }));

import { generateOutreachDraft } from "./actions";
const draft = { recommendation: "WEBSITE_OPPORTUNITY", reasoningSummary: "Có kênh mạng xã hội nhưng chưa có website riêng.", discoveryQuestions: ["Khách thường hỏi gì trước khi đặt?"], messageVariants: (["NATURAL", "VALUE_FIRST", "DEMO_FIRST"] as const).map((style) => ({ style, zaloFacebookDm: Array(40).fill("chào").join(" "), phoneOpener: "Chào anh chị. Em xin phép chia sẻ một ý tưởng ngắn được không?", email: Array(90).fill("chào").join(" ") })), likelyObjections: [], demoRecommendation: { shouldPrepareDemo: false, reason: "Cần hỏi nhu cầu trước.", demoType: "NEEDS_DISCOVERY" }, claimsUsed: ["Bằng chứng đã xác minh."] };

describe("sales assistant generation action", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findLead.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000001", businessName: "Mây", industry: "Homestay", locationText: "Đà Lạt", stage: "NEW", websiteUrl: "https://facebook.com/may", phone: null, email: null, facebookUrl: null, instagramUrl: null, zaloUrl: null, websiteScans: [] }); mocks.generate.mockResolvedValue({ draft, model: "test-model" }); mocks.createDraft.mockResolvedValue({ id: "draft-1" }); });
  it("isolates the lead by workspace and makes one AI request per click", async () => { const form = new FormData(); form.set("leadId", "00000000-0000-4000-8000-000000000001"); await expect(generateOutreachDraft(form)).rejects.toThrow("redirect:/leads/00000000-0000-4000-8000-000000000001?sales=generated"); expect(mocks.findLead).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ workspaceId: "workspace-1" }) })); expect(mocks.generate).toHaveBeenCalledOnce(); expect(mocks.createDraft).toHaveBeenCalledOnce(); });
  it("does not access a lead from another workspace", async () => { mocks.findLead.mockResolvedValue(null); const form = new FormData(); form.set("leadId", "00000000-0000-4000-8000-000000000001"); await expect(generateOutreachDraft(form)).rejects.toThrow("redirect:/leads"); expect(mocks.generate).not.toHaveBeenCalled(); });
});
