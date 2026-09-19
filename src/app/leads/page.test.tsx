import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1" }) }));
vi.mock("../../lib/db", () => ({ db: { lead: { findMany: async () => [
  { id: "low", businessName: "Low Lead", industry: "Cafe", locationText: "Đà Lạt", stage: "NEW", updatedAt: new Date("2026-09-19T10:00:00Z"), phone: null, websiteUrl: "https://example.com", email: null, facebookUrl: null, instagramUrl: null, zaloUrl: null, tasks: [], websiteScans: [] },
  { id: "high", businessName: "High Lead", industry: "Homestay", locationText: "Đà Lạt", stage: "QUALIFIED", updatedAt: new Date("2026-09-18T10:00:00Z"), phone: "0912345678", websiteUrl: null, email: null, facebookUrl: null, instagramUrl: null, zaloUrl: null, tasks: [], websiteScans: [] },
] } } }));

import Leads from "./page";

describe("Leads priority list", () => {
  it("shows dynamic priority and sorts high to low on request", async () => {
    const html = renderToStaticMarkup(await Leads({ searchParams: Promise.resolve({ sort: "priority" }) }));
    expect(html).toContain("Ưu tiên"); expect(html).toContain("Cơ hội"); expect(html).toContain("47"); expect(html).toContain("WARM");
    expect(html.indexOf("High Lead")).toBeLessThan(html.indexOf("Low Lead"));
  });
});
