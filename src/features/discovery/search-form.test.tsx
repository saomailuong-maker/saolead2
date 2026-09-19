import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("./actions", () => ({ searchBusinesses: async () => ({ results: [] }), addToInbox: async () => undefined }));
import { SearchForm } from "./search-form";
describe("discovery UI", () => { it("renders controlled search inputs and submit", () => { const html = renderToStaticMarkup(<SearchForm/>); expect(html).toContain('name="location"'); expect(html).toContain('name="industry"'); expect(html).toContain('name="maxResults"'); expect(html).toContain('type="submit"'); }); });
describe("discovery restore UI", () => { it("renders persisted results supplied after refresh", () => { const html = renderToStaticMarkup(<SearchForm initialState={{ sessionId: "00000000-0000-4000-8000-000000000001", results: [{ provider: "google_places", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt, Lâm Đồng", type: null, location: { latitude: 11.94646, longitude: 108.44193 }, locationQuality: { distanceKm: 0, accepted: true, reason: "WITHIN_AREA" }, inInbox: false }] }}/>); expect(html).toContain("Mây Homestay"); expect(html).toContain("ChIJabc123"); }); });
