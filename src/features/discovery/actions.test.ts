import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(), findInbox: vi.fn(), createInbox: vi.fn(), findQualified: vi.fn(), updateInbox: vi.fn(), transaction: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1", user: { id: "user-1" } }) }));
vi.mock("../../lib/db", () => ({ db: { searchSession: { findFirst: mocks.findSession }, discoveredBusiness: { findUnique: mocks.findInbox, create: mocks.createInbox, findFirst: mocks.findQualified, updateMany: mocks.updateInbox }, $transaction: mocks.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));

import { addToInbox, createCrmLeadFromInbox, setInboxStatus } from "./actions";
const inboxForm = () => { const form = new FormData(); form.set("sessionId", "00000000-0000-4000-8000-000000000001"); form.set("externalId", "ChIJabc123"); return form; };

describe("discovery actions", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findSession.mockResolvedValue({ id: "session-1", resultPlaceIds: ["ChIJabc123"], industry: "Homestay", location: "Đà Lạt" }); });
  it("does not add a place already in Lead Inbox", async () => { mocks.findInbox.mockResolvedValue({ id: "existing" }); await expect(addToInbox(inboxForm())).rejects.toThrow("redirect:/lead-inbox?existing=1"); expect(mocks.createInbox).not.toHaveBeenCalled(); });
  it("qualifies an inbox item within the workspace", async () => { const form = new FormData(); form.set("id", "00000000-0000-4000-8000-000000000002"); form.set("status", "QUALIFIED"); await setInboxStatus(form); expect(mocks.updateInbox).toHaveBeenCalledWith({ where: { id: "00000000-0000-4000-8000-000000000002", workspaceId: "workspace-1", status: { in: ["UNREVIEWED", "QUALIFIED", "REJECTED"] } }, data: { status: "QUALIFIED" } }); });
  it("creates a CRM lead only after qualification and marks the inbox item", async () => {
    const id = "00000000-0000-4000-8000-000000000002";
    mocks.findQualified.mockResolvedValue({ id, industry: "Homestay", location: "Đà Lạt", externalId: "ChIJabc123" });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 }); const update = vi.fn(); const create = vi.fn().mockResolvedValue({ id: "lead-1" });
    mocks.transaction.mockImplementation(async (work) => work({ discoveredBusiness: { updateMany, update }, lead: { create } }));
    const form = new FormData(); form.set("id", id); form.set("businessName", "Mây Homestay"); form.set("locationText", "Đà Lạt");
    await expect(createCrmLeadFromInbox(form)).rejects.toThrow("redirect:/leads/lead-1");
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ businessName: "Mây Homestay", sourceType: "google_places_user_confirmed", sourceExternalId: "ChIJabc123" }) });
    expect(update).toHaveBeenCalledWith({ where: { id }, data: { crmLeadId: "lead-1" } });
  });
});
