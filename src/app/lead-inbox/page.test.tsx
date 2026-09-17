import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("../../lib/auth", () => ({ requireActor: async () => ({ workspaceId: "workspace-1" }) }));
vi.mock("../../lib/db", () => ({ db: { discoveredBusiness: { count: async () => 1, findMany: async () => [{ id: "inbox-1", externalId: "ChIJabc123", industry: "Homestay", location: "Đà Lạt", status: "QUALIFIED", createdAt: new Date("2026-09-17"), crmLeadId: null }] } } }));
vi.mock("../../features/discovery/provider", () => ({ GooglePlacesDiscoveryProvider: class { async getPlace() { return { name: "Mây Homestay", address: "Đà Lạt" }; } } }));
vi.mock("../../features/discovery/actions", () => ({ createCrmLeadFromInbox: async () => undefined, setInboxStatus: async () => undefined }));

import LeadInbox from "./page";
describe("Lead Inbox UI", () => { it("shows a qualified item and CRM creation action", async () => { const html = renderToStaticMarkup(await LeadInbox({ searchParams: Promise.resolve({}) })); expect(html).toContain("Mây Homestay"); expect(html).toContain("Create CRM Lead"); expect(html).toContain('name="businessName"'); }); });
