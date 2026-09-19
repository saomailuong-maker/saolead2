import { describe, expect, it, vi } from "vitest";
import { PlacesConfigError, PlacesTransportError, RapidApiPlacesTransport, RAPIDAPI_EXPECTED_HOST, RAPIDAPI_TEXT_SEARCH_URL, createSearchTransport } from "./provider";
import { searchInputSchema } from "./query";

const input = searchInputSchema.parse({ location: "Đà Lạt", industry: "Homestay", maxResults: 20 });
const response = (body: unknown, status = 200) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("RapidApiPlacesTransport", () => {
  it("normalizes results and preserves Google Place ID identity", async () => {
    const request = vi.fn(async (...args: Parameters<typeof fetch>) => { void args; return response({ places: [{ id: "ChIJabc123", displayName: { text: "Mây Homestay", languageCode: "vi" }, formattedAddress: "Đà Lạt" }, { id: "ChIJabc123", displayName: { text: "Duplicate" } }] }); });
    const result = await new RapidApiPlacesTransport("test-key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input);
    expect(result).toEqual([{ provider: "google_places", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt", type: null }]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0]).toBe(RAPIDAPI_TEXT_SEARCH_URL);
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({ "X-RapidAPI-Key": "test-key", "X-RapidAPI-Host": RAPIDAPI_EXPECTED_HOST, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress" });
    expect(JSON.parse(String(request.mock.calls[0]?.[1]?.body))).toEqual({ textQuery: "homestay in Đà Lạt, Lâm Đồng, Việt Nam", pageSize: 20 });
  });
  it("returns an empty list", async () => { const request = vi.fn(async () => response({ places: [] })); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input)).resolves.toEqual([]); });
  it("fails when the key is missing", async () => { await expect(new RapidApiPlacesTransport("", RAPIDAPI_EXPECTED_HOST, vi.fn() as typeof fetch).search(input)).rejects.toBeInstanceOf(PlacesConfigError); });
  it("fails when the host is missing", async () => { await expect(new RapidApiPlacesTransport("key", "", vi.fn() as typeof fetch).search(input)).rejects.toBeInstanceOf(PlacesConfigError); });
  it.each([401, 403, 429])("reports HTTP %s safely", async (status) => {
    const request = vi.fn(async () => response({ message: status === 429 ? "Too many requests" : "Unauthorized", code: `HTTP_${status}` }, status));
    const promise = new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input);
    await expect(promise).rejects.toMatchObject({ transport: "rapidapi", operation: "text_search", httpStatus: status, providerCode: `HTTP_${status}` } satisfies Partial<PlacesTransportError>);
  });
  it("rejects a malformed response", async () => { const request = vi.fn(async () => response({ places: "invalid" })); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input)).rejects.toMatchObject({ providerCode: "MALFORMED_RESPONSE" }); });
  it("keeps direct Google selectable as fallback", () => { expect(createSearchTransport("direct-google").name).toBe("direct-google"); expect(createSearchTransport("rapidapi").name).toBe("rapidapi"); });
});
