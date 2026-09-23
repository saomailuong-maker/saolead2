import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(), findInbox: vi.fn(), createInbox: vi.fn(), findQualified: vi.fn(), updateInbox: vi.fn(), findDiscovered: vi.fn(), findProviderLog: vi.fn(), createProviderLog: vi.fn(), transaction: vi.fn(), revalidate: vi.fn(), getDetails: vi.fn(), findManySessions: vi.fn(),
  findLeads: vi.fn(), createLead: vi.fn(), upsertInbox: vi.fn(), updateInboxSingle: vi.fn(),
}));
vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1", user: { id: "user-1" } }) }));
vi.mock("../../lib/db", () => ({
  db: {
    searchSession: { findFirst: mocks.findSession, findMany: mocks.findManySessions },
    providerRequestLog: { findFirst: mocks.findProviderLog, create: mocks.createProviderLog },
    discoveredBusiness: { findUnique: mocks.findInbox, create: mocks.createInbox, findFirst: mocks.findQualified, findMany: mocks.findDiscovered, updateMany: mocks.updateInbox, upsert: mocks.upsertInbox, update: mocks.updateInboxSingle },
    lead: { findMany: mocks.findLeads, create: mocks.createLead },
    $transaction: mocks.transaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("./provider", async (importOriginal) => { const actual = await importOriginal<typeof import("./provider")>(); return { ...actual, PlacesService: class { transportName = "rapidapi"; getDetails = mocks.getDetails; } }; });

import { addToInbox, bulkImportToCrm, createCrmLeadFromInbox, getRecentSearchSessions, restoreSearchSession, setInboxStatus } from "./actions";
const inboxForm = () => { const form = new FormData(); form.set("sessionId", "00000000-0000-4000-8000-000000000001"); form.set("externalId", "ChIJabc123"); return form; };

describe("discovery actions", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.findLeads.mockResolvedValue([]); mocks.findProviderLog.mockResolvedValue(null); mocks.findSession.mockResolvedValue({ id: "session-1", resultPlaceIds: ["ChIJabc123"], resultsJson: [{ provider: "google_places", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt", type: null }], industry: "Homestay", location: "Đà Lạt" }); mocks.getDetails.mockResolvedValue({ sourceSystem: "google_places", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt", phone: "0912345678", internationalPhone: null, websiteUrl: "https://example.com", rating: 4.7, reviewCount: 128, openingHours: { weekdayDescriptions: [] }, businessStatus: "OPERATIONAL" }); });
  it("does not add a place already in Lead Inbox", async () => { mocks.findInbox.mockResolvedValue({ id: "existing" }); await expect(addToInbox(inboxForm())).rejects.toThrow("redirect:/lead-inbox?existing=1"); expect(mocks.createInbox).not.toHaveBeenCalled(); });
  it("enriches only when adding a selected place", async () => { mocks.findInbox.mockResolvedValue(null); mocks.createInbox.mockResolvedValue({ id: "inbox-1" }); await expect(addToInbox(inboxForm())).rejects.toThrow("redirect:/lead-inbox?added=1"); expect(mocks.getDetails).toHaveBeenCalledOnce(); expect(mocks.getDetails).toHaveBeenCalledWith("ChIJabc123"); expect(mocks.createInbox).toHaveBeenCalledWith({ data: expect.objectContaining({ name: "Mây Homestay", phone: "0912345678", websiteUrl: "https://example.com", rating: 4.7, reviewCount: 128, detailsStatus: "SUCCESS" }) }); });
  it("keeps a basic Inbox item when details fail", async () => { mocks.findInbox.mockResolvedValue(null); mocks.getDetails.mockRejectedValue(new Error("provider failed")); mocks.createInbox.mockResolvedValue({ id: "inbox-1" }); await expect(addToInbox(inboxForm())).rejects.toThrow("redirect:/lead-inbox?added=1"); expect(mocks.createInbox).toHaveBeenCalledWith({ data: expect.objectContaining({ name: "Mây Homestay", phone: null, websiteUrl: null, detailsStatus: "FAILED", detailsErrorCode: "UNKNOWN" }) }); });
  it("qualifies an inbox item within the workspace", async () => { const form = new FormData(); form.set("id", "00000000-0000-4000-8000-000000000002"); form.set("status", "QUALIFIED"); await setInboxStatus(form); expect(mocks.updateInbox).toHaveBeenCalledWith({ where: { id: "00000000-0000-4000-8000-000000000002", workspaceId: "workspace-1", status: { in: ["UNREVIEWED", "QUALIFIED", "REJECTED"] } }, data: { status: "QUALIFIED" } }); });
  it("creates a CRM lead only after qualification and marks the inbox item", async () => {
    const id = "00000000-0000-4000-8000-000000000002";
    mocks.findQualified.mockResolvedValue({ id, industry: "Homestay", location: "Đà Lạt", address: "Đà Lạt", externalId: "ChIJabc123", phone: "0912345678", websiteUrl: "https://example.com" });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 }); const update = vi.fn(); const create = vi.fn().mockResolvedValue({ id: "lead-1" });
    mocks.transaction.mockImplementation(async (work) => work({ discoveredBusiness: { updateMany, update }, lead: { create } }));
    const form = new FormData(); form.set("id", id); form.set("businessName", "Mây Homestay"); form.set("locationText", "Đà Lạt");
    await expect(createCrmLeadFromInbox(form)).rejects.toThrow("redirect:/leads/lead-1");
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ businessName: "Mây Homestay", phone: "0912345678", websiteUrl: "https://example.com", sourceType: "google_places_user_confirmed", sourceExternalId: "ChIJabc123" }) });
    expect(create.mock.calls[0]?.[0]?.data.email).toBeUndefined();
    expect(update).toHaveBeenCalledWith({ where: { id }, data: { crmLeadId: "lead-1" } });
  });
  it("restores only a current-workspace session without calling the provider", async () => { const id = "00000000-0000-4000-8000-000000000001"; mocks.findSession.mockResolvedValue({ id, resultsJson: [{ provider: "google_places", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt, Lâm Đồng", type: null, location: { latitude: 11.94646, longitude: 108.44193 }, locationQuality: { distanceKm: 0, accepted: true, reason: "WITHIN_AREA" } }] }); mocks.findDiscovered.mockResolvedValue([{ externalId: "ChIJabc123" }]); await expect(restoreSearchSession(id)).resolves.toMatchObject({ sessionId: id, results: [expect.objectContaining({ externalId: "ChIJabc123", inInbox: true })] }); expect(mocks.findSession).toHaveBeenCalledWith({ where: { id, workspaceId: "workspace-1", provider: "google_places" } }); expect(mocks.getDetails).not.toHaveBeenCalled(); });
  it("does not restore another workspace's session", async () => { mocks.findSession.mockResolvedValue(null); await expect(restoreSearchSession("00000000-0000-4000-8000-000000000001")).resolves.toEqual({ results: [] }); expect(mocks.findDiscovered).not.toHaveBeenCalled(); });
  it("returns recent search sessions for the workspace", async () => {
    mocks.findManySessions.mockResolvedValue([
      { id: "s-1", location: "Đà Lạt", industry: "Homestay", query: "homestay Đà Lạt", resultCount: 20, mode: "STANDARD", searchStats: null, createdAt: new Date() },
    ]);
    const history = await getRecentSearchSessions(5);
    expect(history).toHaveLength(1);
    expect(history[0]?.id).toBe("s-1");
    expect(mocks.findManySessions).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });

  it("imports multiple places into CRM and skips duplicates", async () => {
    mocks.findSession.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      industry: "Homestay",
      location: "Đà Lạt",
      resultsJson: [
        { externalId: "ChIJ_111", name: "Homestay 1", address: "Đà Lạt" },
        { externalId: "ChIJ_222", name: "Homestay 2", address: "Đà Lạt" },
      ],
    });
    mocks.findLeads.mockResolvedValue([{ sourceExternalId: "ChIJ_222" }]);
    mocks.getDetails.mockResolvedValue({
      sourceSystem: "google_places",
      externalId: "ChIJ_111",
      name: "Homestay 1 Enriched",
      address: "123 Đà Lạt",
      phone: "0988776655",
      websiteUrl: null,
      rating: 4.8,
      reviewCount: 50,
      businessStatus: "OPERATIONAL",
    });
    mocks.upsertInbox.mockResolvedValue({ id: "inbox-new-1" });
    mocks.createLead.mockResolvedValue({ id: "lead-new-1" });

    const result = await bulkImportToCrm({
      sessionId: "00000000-0000-4000-8000-000000000001",
      externalIds: ["ChIJ_111", "ChIJ_222"],
    });

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.leadIds).toEqual(["lead-new-1"]);
    expect(mocks.createLead).toHaveBeenCalledWith({
      data: expect.objectContaining({
        businessName: "Homestay 1 Enriched",
        phone: "0988776655",
        sourceExternalId: "ChIJ_111",
        stage: "NEW",
      }),
    });
  });
});
