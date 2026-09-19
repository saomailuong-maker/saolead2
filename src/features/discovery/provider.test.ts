import { describe, expect, it, vi } from "vitest";
import { PlacesConfigError, PlacesService, PlacesTransportError, RapidApiPlacesTransport, RAPIDAPI_EXPECTED_HOST, RAPIDAPI_PLACE_DETAILS_BASE_URL, RAPIDAPI_TEXT_SEARCH_URL, createSearchTransport, parseQuotaHeaders } from "./provider";
import { searchInputSchema } from "./query";

const input = searchInputSchema.parse({ location: "Đà Lạt", industry: "Homestay", maxResults: 20 });
const response = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

describe("RapidApiPlacesTransport", () => {
  it("normalizes results and preserves Google Place ID identity", async () => {
    const request = vi.fn(async (...args: Parameters<typeof fetch>) => { void args; return response({ places: [{ id: "ChIJabc123", displayName: { text: "Mây Homestay", languageCode: "vi" }, formattedAddress: "Đà Lạt, Lâm Đồng", location: { latitude: 11.94646, longitude: 108.44193 } }, { id: "ChIJabc123", displayName: { text: "Duplicate" }, location: { latitude: 11.94646, longitude: 108.44193 } }] }); });
    const result = await new RapidApiPlacesTransport("test-key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input);
    expect(result).toEqual([{ provider: "google_places", externalId: "ChIJabc123", name: "Mây Homestay", address: "Đà Lạt, Lâm Đồng", type: null, location: { latitude: 11.94646, longitude: 108.44193 }, locationQuality: { distanceKm: 0, accepted: true, reason: "WITHIN_AREA" } }]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0]).toBe(RAPIDAPI_TEXT_SEARCH_URL);
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({ "X-RapidAPI-Key": "test-key", "X-RapidAPI-Host": RAPIDAPI_EXPECTED_HOST, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location" });
    const body = JSON.parse(String(request.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({ textQuery: "homestay Đà Lạt", languageCode: "vi", regionCode: "VN", locationRestriction: { rectangle: { low: { latitude: expect.any(Number), longitude: expect.any(Number) }, high: { latitude: expect.any(Number), longitude: expect.any(Number) } } }, pageSize: 20 });
    expect(body.locationRestriction).not.toHaveProperty("circle"); expect(body).not.toHaveProperty("locationBias");
  });
  it("sends a Đức Trọng rectangle restriction and rejects a remote result with a misleading name", async () => { const localInput = searchInputSchema.parse({ location: "Đức Trọng", industry: "Khách sạn", maxResults: 20 }); const request = vi.fn<typeof fetch>(async () => response({ places: [{ id: "ChIJremote", displayName: { text: "Khách sạn Đức Trọng" }, formattedAddress: "Cầu Giấy, Hà Nội", location: { latitude: 21.0278, longitude: 105.8342 } }] })); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request).search(localInput)).resolves.toEqual([]); expect(request).toHaveBeenCalledOnce(); const body = JSON.parse(String(request.mock.calls[0]?.[1]?.body)); expect(body.locationRestriction.rectangle.low.latitude).toBeLessThan(11.69722); expect(body.locationRestriction.rectangle.high.latitude).toBeGreaterThan(11.69722); expect(body.locationRestriction).not.toHaveProperty("circle"); expect(body).not.toHaveProperty("locationBias"); });
  it("returns an empty list", async () => { const request = vi.fn(async () => response({ places: [] })); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input)).resolves.toEqual([]); });
  it("fails when the key is missing", async () => { await expect(new RapidApiPlacesTransport("", RAPIDAPI_EXPECTED_HOST, vi.fn() as typeof fetch).search(input)).rejects.toBeInstanceOf(PlacesConfigError); });
  it("fails when the host is missing", async () => { await expect(new RapidApiPlacesTransport("key", "", vi.fn() as typeof fetch).search(input)).rejects.toBeInstanceOf(PlacesConfigError); });
  it.each([401, 403, 429])("reports HTTP %s safely", async (status) => {
    const request = vi.fn(async () => response({ message: status === 429 ? "Too many requests" : "Unauthorized", code: `HTTP_${status}` }, status));
    const promise = new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input);
    await expect(promise).rejects.toMatchObject({ transport: "rapidapi", operation: "text_search", kind: status === 429 ? "QUOTA" : "AUTH", httpStatus: status, providerCode: `HTTP_${status}` } satisfies Partial<PlacesTransportError>);
  });
  it.each([[400, "BAD_REQUEST"], [500, "PROVIDER"]])("maps HTTP %s to %s", async (status, kind) => { const request = vi.fn(async () => response({ message: "Provider error" }, Number(status))); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input)).rejects.toMatchObject({ kind, httpStatus: status }); });
  it("redacts secret-like values from provider messages", async () => { const request = vi.fn(async () => response({ message: "api_key=do-not-render token=hidden" }, 400)); const promise = new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input); await expect(promise).rejects.toMatchObject({ providerMessage: "api_key=[redacted] token=[redacted]" }); await promise.catch((error: PlacesTransportError) => expect(error.providerMessage).not.toContain("do-not-render")); });
  it("maps a search timeout", async () => { const request = vi.fn(async () => { throw new DOMException("Timed out", "TimeoutError"); }); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input)).rejects.toMatchObject({ kind: "TIMEOUT", providerCode: "TIMEOUT" }); });
  it("parses RapidAPI quota headers and handles absence", () => { expect(parseQuotaHeaders(new Headers({ "x-ratelimit-requests-limit": "100", "x-ratelimit-requests-remaining": "42", "x-ratelimit-requests-reset": "3600" }))).toEqual({ requests: { limit: "100", remaining: "42", reset: "3600" } }); expect(parseQuotaHeaders(new Headers())).toBeNull(); });
  it("rejects a malformed response", async () => { const request = vi.fn(async () => response({ places: "invalid" })); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).search(input)).rejects.toMatchObject({ providerCode: "MALFORMED_RESPONSE" }); });
  it("keeps direct Google selectable as fallback", () => { expect(createSearchTransport("direct-google").name).toBe("direct-google"); expect(createSearchTransport("rapidapi").name).toBe("rapidapi"); });

  it("routes Place Details through RapidAPI and normalizes enrichment", async () => {
    const request = vi.fn(async (...args: Parameters<typeof fetch>) => { void args; return response({ id: "ChIJabc123", displayName: { text: "Mây Homestay" }, formattedAddress: "Đà Lạt", nationalPhoneNumber: "0912 345 678", internationalPhoneNumber: "+84 912 345 678", websiteUri: "https://example.com", rating: 4.7, userRatingCount: 128, regularOpeningHours: { weekdayDescriptions: ["Thứ Hai: 08:00–17:00"] }, businessStatus: "OPERATIONAL" }); });
    const transport = new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch);
    const details = await new PlacesService(transport).getDetails("ChIJabc123");
    expect(details).toMatchObject({ sourceSystem: "google_places", externalId: "ChIJabc123", phone: "0912 345 678", websiteUrl: "https://example.com", rating: 4.7, reviewCount: 128, businessStatus: "OPERATIONAL" });
    expect(request.mock.calls[0]?.[0]).toBe(`${RAPIDAPI_PLACE_DETAILS_BASE_URL}/ChIJabc123`);
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({ "X-RapidAPI-Host": RAPIDAPI_EXPECTED_HOST, "X-Goog-FieldMask": "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours,businessStatus" });
    expect(request.mock.calls[0]?.[1]?.headers).not.toHaveProperty("X-Goog-Api-Key");
  });

  it("accepts missing optional detail fields", async () => { const request = vi.fn(async () => response({ id: "ChIJabc123" })); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).getDetails("ChIJabc123")).resolves.toMatchObject({ phone: null, websiteUrl: null, rating: null, reviewCount: null, openingHours: null }); });
  it.each([403, 404, 429])("reports Place Details HTTP %s", async (status) => { const request = vi.fn(async () => response({ code: `HTTP_${status}`, message: "Provider error" }, status)); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).getDetails("ChIJabc123")).rejects.toMatchObject({ operation: "details", httpStatus: status, providerCode: `HTTP_${status}` }); });
  it("reports malformed Place Details", async () => { const request = vi.fn(async () => response({ displayName: { text: "Missing ID" } })); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).getDetails("ChIJabc123")).rejects.toMatchObject({ operation: "details", providerCode: "MALFORMED_RESPONSE" }); });
  it("reports Place Details timeout", async () => { const request = vi.fn(async () => { throw new DOMException("Timed out", "TimeoutError"); }); await expect(new RapidApiPlacesTransport("key", RAPIDAPI_EXPECTED_HOST, request as typeof fetch).getDetails("ChIJabc123")).rejects.toMatchObject({ operation: "details", providerCode: "TIMEOUT", httpStatus: null }); });
});
