import { describe, expect, it, vi } from "vitest";
import { GooglePlacesDiscoveryProvider, MissingGoogleKeyError, GooglePlacesError } from "./provider";
import { searchInputSchema } from "./query";
const input = searchInputSchema.parse({ location: "Đà Lạt", industry: "Homestay", maxResults: 10 });
describe("GooglePlacesDiscoveryProvider", () => {
  it("normalizes a minimal response without extra fields", async () => {
    const request = vi.fn(async (...args: Parameters<typeof fetch>) => { void args; return new Response(JSON.stringify({ places: [{ id: "ChIJabc123", displayName: { text: "Mây Homestay" }, formattedAddress: "Đà Lạt", primaryType: "lodging" }] }), { status: 200 }); });
    const result = await new GooglePlacesDiscoveryProvider("test-key", request as typeof fetch).search(input);
    expect(result).toEqual([{ provider: "google_places", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt", type: "lodging" }]);
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({ "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.primaryType,nextPageToken" });
  });
  it("reports missing key and provider failures", async () => {
    await expect(new GooglePlacesDiscoveryProvider("", vi.fn() as typeof fetch).search(input)).rejects.toBeInstanceOf(MissingGoogleKeyError);
    const request = vi.fn(async () => new Response("error", { status: 403 }));
    await expect(new GooglePlacesDiscoveryProvider("test-key", request as typeof fetch).search(input)).rejects.toBeInstanceOf(GooglePlacesError);
  });
  it("uses at most two 20-result pages for a 40-result search", async () => {
    const request = vi.fn(async (...args: Parameters<typeof fetch>) => {
      const body = JSON.parse(String(args[1]?.body)) as { pageToken?: string; pageSize: number };
      const offset = body.pageToken ? 20 : 0;
      return new Response(JSON.stringify({ places: Array.from({ length: 20 }, (_, i) => ({ id: `ChIJplace${offset + i}`, displayName: { text: `Business ${offset + i}` } })), ...(!body.pageToken ? { nextPageToken: "next-page" } : {}) }), { status: 200 });
    });
    const results = await new GooglePlacesDiscoveryProvider("test-key", request as typeof fetch).search({ ...input, maxResults: 40 });
    expect(results).toHaveLength(40);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
