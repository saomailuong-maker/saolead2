import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BusinessDiscoveryProvider, BusinessSearchResult } from "./provider";
import { searchInputSchema } from "./query";

const mocks = vi.hoisted(() => ({
  findManySeen: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: {
    discoverySeenPlace: {
      findMany: mocks.findManySeen,
    },
  },
}));

import { executeFindNewLeads } from "./find-new";

const makePlace = (id: string, name: string): BusinessSearchResult => ({
  provider: "google_places",
  externalId: id,
  name,
  address: "Đà Lạt",
  type: "lodging",
  location: { latitude: 11.94, longitude: 108.44 },
  locationQuality: { distanceKm: 1, accepted: true, reason: "WITHIN_AREA" },
});

const input = searchInputSchema.parse({
  location: "Đà Lạt",
  industry: "Homestay",
  maxResults: 20,
});

describe("executeFindNewLeads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findManySeen.mockResolvedValue([]);
  });

  it("stops after 1 request if target count is satisfied", async () => {
    const p1 = makePlace("id_1", "Place 1");
    const p2 = makePlace("id_2", "Place 2");

    const provider: BusinessDiscoveryProvider = {
      search: vi.fn(),
      searchWithPagination: vi.fn().mockResolvedValue({
        results: [p1, p2],
        nextPageToken: "token_123",
      }),
      getDetails: vi.fn(),
    };

    const result = await executeFindNewLeads({
      workspaceId: "ws-1",
      input: { ...input, maxResults: 10 },
      provider,
      targetNewCount: 2,
    });

    expect(result.newPlaces).toHaveLength(2);
    expect(result.stats.requestsUsed).toBe(1);
    expect(result.stats.newFound).toBe(2);
    expect(result.stats.skippedSeen).toBe(0);
    expect(provider.searchWithPagination).toHaveBeenCalledTimes(1);
  });

  it("filters out previously seen places and requests next page with token", async () => {
    // id_1 is already seen
    mocks.findManySeen.mockResolvedValue([{ externalId: "id_1" }]);

    const p1 = makePlace("id_1", "Old Place");
    const p2 = makePlace("id_2", "New Place 1");
    const p3 = makePlace("id_3", "New Place 2");

    const provider: BusinessDiscoveryProvider = {
      search: vi.fn(),
      searchWithPagination: vi
        .fn()
        .mockResolvedValueOnce({
          results: [p1, p2],
          nextPageToken: "next_page_token_abc",
        })
        .mockResolvedValueOnce({
          results: [p3],
          nextPageToken: null,
        }),
      getDetails: vi.fn(),
    };

    const result = await executeFindNewLeads({
      workspaceId: "ws-1",
      input,
      provider,
      targetNewCount: 2,
    });

    expect(result.newPlaces).toHaveLength(2);
    expect(result.newPlaces.map((p) => p.externalId)).toEqual(["id_2", "id_3"]);
    expect(result.stats.requestsUsed).toBe(2);
    expect(result.stats.skippedSeen).toBe(1);
    expect(result.stats.newFound).toBe(2);

    expect(provider.searchWithPagination).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ pageToken: "next_page_token_abc" })
    );
  });

  it("never exceeds hard limit of 3 requests even if target is not met", async () => {
    mocks.findManySeen.mockResolvedValue([]);

    const provider: BusinessDiscoveryProvider = {
      search: vi.fn(),
      searchWithPagination: vi.fn().mockResolvedValue({
        results: [makePlace("id_dup", "Repeated Place")],
        nextPageToken: null,
      }),
      getDetails: vi.fn(),
    };

    const result = await executeFindNewLeads({
      workspaceId: "ws-1",
      input,
      provider,
      maxRequestsLimit: 3,
      targetNewCount: 20,
    });

    expect(result.stats.requestsUsed).toBeLessThanOrEqual(3);
    expect(provider.searchWithPagination).toHaveBeenCalledTimes(3);
    // Only 1 unique place added, others skipped
    expect(result.newPlaces).toHaveLength(1);
    expect(result.stats.skippedSeen).toBe(2);
  });

  it("handles error on subsequent request gracefully and returns what was found", async () => {
    const p1 = makePlace("id_1", "Place 1");

    const provider: BusinessDiscoveryProvider = {
      search: vi.fn(),
      searchWithPagination: vi
        .fn()
        .mockResolvedValueOnce({
          results: [p1],
          nextPageToken: "page_token_fail",
        })
        .mockRejectedValueOnce(new Error("API rate limit")),
      getDetails: vi.fn(),
    };

    const result = await executeFindNewLeads({
      workspaceId: "ws-1",
      input,
      provider,
      targetNewCount: 10,
    });

    expect(result.newPlaces).toHaveLength(1);
    expect(result.stats.requestsUsed).toBe(2);
  });
});
