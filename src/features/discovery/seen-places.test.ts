import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BusinessSearchResult } from "./provider";

const mocks = vi.hoisted(() => ({
  findManySeen: vi.fn(),
  createSeen: vi.fn(),
  updateSeen: vi.fn(),
  findManyLeads: vi.fn(),
  findManyDiscovered: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: {
    discoverySeenPlace: {
      findMany: mocks.findManySeen,
      create: mocks.createSeen,
      update: mocks.updateSeen,
    },
    lead: {
      findMany: mocks.findManyLeads,
    },
    discoveredBusiness: {
      findMany: mocks.findManyDiscovered,
    },
  },
}));

import { getSeenPlaceIds, recordSeenPlaces, resolvePlacesStatus } from "./seen-places";

const samplePlaces: BusinessSearchResult[] = [
  {
    provider: "google_places",
    externalId: "ChIJ_place1",
    name: "Mây Homestay",
    address: "Đà Lạt",
    type: "lodging",
    location: { latitude: 11.94, longitude: 108.44 },
    locationQuality: { distanceKm: 1, accepted: true, reason: "WITHIN_AREA" },
  },
  {
    provider: "google_places",
    externalId: "ChIJ_place2",
    name: "Thông Reo Homestay",
    address: "Đà Lạt",
    type: "lodging",
    location: { latitude: 11.95, longitude: 108.45 },
    locationQuality: { distanceKm: 2, accepted: true, reason: "WITHIN_AREA" },
  },
];

describe("seen-places logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getSeenPlaceIds returns set of externalIds", async () => {
    mocks.findManySeen.mockResolvedValue([{ externalId: "ChIJ_1" }, { externalId: "ChIJ_2" }]);
    const set = await getSeenPlaceIds("ws-1", "Đà Lạt", "Homestay");
    expect(set).toEqual(new Set(["ChIJ_1", "ChIJ_2"]));
    expect(mocks.findManySeen).toHaveBeenCalledWith({
      where: {
        workspaceId: "ws-1",
        provider: "google_places",
        location: "Đà Lạt",
        industry: "Homestay",
      },
      select: { externalId: true },
    });
  });

  it("recordSeenPlaces creates new records and increments existing", async () => {
    mocks.findManySeen.mockResolvedValue([
      { id: "sp-1", externalId: "ChIJ_place1", seenCount: 2 },
    ]);

    const result = await recordSeenPlaces("ws-1", samplePlaces, "Đà Lạt", "Homestay", "session-1");
    expect(result.get("ChIJ_place1")).toBe(3);
    expect(result.get("ChIJ_place2")).toBe(1);

    expect(mocks.updateSeen).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sp-1" },
        data: expect.objectContaining({ seenCount: 3 }),
      })
    );

    expect(mocks.createSeen).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: "ws-1",
          externalId: "ChIJ_place2",
          seenCount: 1,
        }),
      })
    );
  });

  it("resolvePlacesStatus correctly classifies CRM, INBOX, REJECTED, SEEN_BEFORE, and NEW", async () => {
    const places: BusinessSearchResult[] = [
      { ...samplePlaces[0], externalId: "id_crm" },
      { ...samplePlaces[0], externalId: "id_inbox" },
      { ...samplePlaces[0], externalId: "id_rejected" },
      { ...samplePlaces[0], externalId: "id_seen" },
      { ...samplePlaces[0], externalId: "id_new" },
    ];

    mocks.findManyLeads.mockResolvedValue([{ sourceExternalId: "id_crm" }]);
    mocks.findManyDiscovered.mockResolvedValue([
      { externalId: "id_inbox", status: "QUALIFIED" },
      { externalId: "id_rejected", status: "REJECTED" },
    ]);
    mocks.findManySeen.mockResolvedValue([
      { externalId: "id_seen", seenCount: 3 },
      { externalId: "id_new", seenCount: 1 },
    ]);

    const resolved = await resolvePlacesStatus("ws-1", places);

    expect(resolved.find((p) => p.externalId === "id_crm")?.discoveryStatus).toBe("CRM");
    expect(resolved.find((p) => p.externalId === "id_inbox")?.discoveryStatus).toBe("INBOX");
    expect(resolved.find((p) => p.externalId === "id_rejected")?.discoveryStatus).toBe("REJECTED");
    expect(resolved.find((p) => p.externalId === "id_seen")?.discoveryStatus).toBe("SEEN_BEFORE");
    expect(resolved.find((p) => p.externalId === "id_new")?.discoveryStatus).toBe("NEW");
  });
});
