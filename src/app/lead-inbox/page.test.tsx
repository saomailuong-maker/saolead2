import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1" }) }));
vi.mock("../../lib/db", () => ({ db: { discoveredBusiness: { count: async () => 1, findMany: async () => [{ id: "inbox-1", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt", industry: "Homestay", location: "Đà Lạt", phone: "0912345678", websiteUrl: "https://example.com", rating: 4.7, reviewCount: 128, openingHours: { weekdayDescriptions: ["Thứ Hai: 08:00–17:00"] }, detailsStatus: "SUCCESS", status: "QUALIFIED", createdAt: new Date("2026-09-17"), crmLeadId: null }] } } }));
vi.mock("../../features/discovery/actions", () => ({ createCrmLeadFromInbox: async () => undefined, setInboxStatus: async () => undefined }));

import LeadInbox from "./page";
describe("Lead Inbox UI", () => { it("shows enrichment and CRM creation action", async () => { const html = renderToStaticMarkup(await LeadInbox({ searchParams: Promise.resolve({}) })); expect(html).toContain("Mây Homestay"); expect(html).toContain("0912345678"); expect(html).toContain("4.7/5"); expect(html).toContain("Create CRM Lead"); expect(html).toContain('name="businessName"'); }); });
