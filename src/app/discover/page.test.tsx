import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/auth", () => ({
  requireActor: async () => ({ workspaceId: "workspace-1", user: { id: "user-1", email: "admin@saobeo.com", name: "Sao Béo" } }),
}));

vi.mock("../../features/discovery/actions", () => ({
  getRecentSearchSessions: async () => [
    {
      id: "s-1",
      location: "Đà Lạt",
      industry: "Homestay",
      query: "homestay Đà Lạt",
      resultCount: 20,
      mode: "STANDARD",
      searchStats: null,
      createdAt: new Date(),
    },
  ],
  restoreSearchSession: async () => ({ results: [] }),
  searchBusinesses: async () => ({ results: [] }),
  addToInbox: async () => undefined,
}));

import Discover from "./page";

describe("Discover page", () => {
  it("renders page title, search history section, and search form", async () => {
    const page = await Discover({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Tìm khách hàng");
    expect(html).toContain("Lịch sử tìm kiếm gần đây");
    expect(html).toContain("Đà Lạt · Homestay");
    expect(html).toContain("Tìm thêm khách mới");
  });

  it("restores session and marks active session in search history", async () => {
    const page = await Discover({ searchParams: Promise.resolve({ session: "s-1" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Đang mở");
    expect(html).toContain("Đang xem");
  });
});
