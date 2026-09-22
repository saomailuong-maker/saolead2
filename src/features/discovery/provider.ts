import { z } from "zod";
import type { SearchBusinessesInput } from "./query";
import { buildTextQuery } from "./query";
import { assessLocationQuality, deriveSearchViewport, searchAreas } from "./search-areas";

export type PlacesTransport = "rapidapi" | "direct-google";
export type ProviderErrorKind = "CONFIG" | "BAD_REQUEST" | "AUTH" | "QUOTA" | "TIMEOUT" | "NETWORK" | "PROVIDER" | "MALFORMED_RESPONSE";
export type ProviderQuotaMetric = { limit: string | null; remaining: string | null; reset: string | null };
export type ProviderQuotaSnapshot = { requests?: ProviderQuotaMetric; generic?: ProviderQuotaMetric; rapidFreePlansHardLimit?: ProviderQuotaMetric };
export type ProviderDiagnostics = { transport: PlacesTransport; operation: "text_search" | "details"; status: "SUCCESS" | "ERROR"; errorKind: ProviderErrorKind | null; httpStatus: number | null; providerCode: string | null; providerMessage: string | null; durationMs: number | null; quota: ProviderQuotaSnapshot | null };
export const businessSearchResultSchema = z.object({ provider: z.literal("google_places"), externalId: z.string(), name: z.string(), address: z.string().nullable(), type: z.string().nullable(), location: z.object({ latitude: z.number(), longitude: z.number() }).nullable(), locationQuality: z.object({ distanceKm: z.number().nullable(), accepted: z.boolean(), reason: z.enum(["WITHIN_AREA", "OUTSIDE_AREA", "MISSING_COORDINATES", "ADDRESS_CONFLICT"]) }) });
export type BusinessSearchResult = z.infer<typeof businessSearchResultSchema>;
export type PlaceDetailsEnrichment = { sourceSystem: "google_places"; externalId: string; name: string | null; address: string | null; phone: string | null; internationalPhone: string | null; websiteUrl: string | null; rating: number | null; reviewCount: number | null; openingHours: unknown | null; businessStatus: string | null };
export type SearchBusinessesOptions = SearchBusinessesInput & {
  pageToken?: string | null;
  customQuery?: string | null;
};
export type SearchResultWithPagination = {
  results: BusinessSearchResult[];
  nextPageToken: string | null;
};
export interface BusinessDiscoveryProvider {
  readonly lastDiagnostics?: ProviderDiagnostics | null;
  readonly transportName?: string;
  search(input: SearchBusinessesOptions): Promise<BusinessSearchResult[]>;
  searchWithPagination(input: SearchBusinessesOptions): Promise<SearchResultWithPagination>;
  getDetails(id: string): Promise<PlaceDetailsEnrichment>;
}
interface PlacesTransportAdapter {
  readonly name: PlacesTransport;
  lastDiagnostics: ProviderDiagnostics | null;
  search(input: SearchBusinessesOptions): Promise<BusinessSearchResult[]>;
  searchWithPagination(input: SearchBusinessesOptions): Promise<SearchResultWithPagination>;
  getDetails(id: string): Promise<PlaceDetailsEnrichment>;
}

export class PlacesConfigError extends Error { constructor(public readonly transport: PlacesTransport, message: string) { super(message); this.name = "PlacesConfigError"; } }
export class PlacesTransportError extends Error {
  constructor(public readonly transport: PlacesTransport, public readonly operation: "text_search" | "details", public readonly kind: ProviderErrorKind, public readonly httpStatus: number | null, public readonly providerCode: string | null, public readonly providerMessage: string | null, public readonly durationMs: number, public readonly quota: ProviderQuotaSnapshot | null = null) { super(`${transport} ${operation} failed`); this.name = "PlacesTransportError"; }
}

const placeSchema = z.object({ id: z.string().min(1), displayName: z.object({ text: z.string() }).optional(), formattedAddress: z.string().optional(), primaryType: z.string().optional(), location: z.object({ latitude: z.number(), longitude: z.number() }).optional() });
const detailsSchema = placeSchema.extend({ nationalPhoneNumber: z.string().optional(), internationalPhoneNumber: z.string().optional(), websiteUri: z.string().url().optional(), rating: z.number().min(0).max(5).optional(), userRatingCount: z.number().int().nonnegative().optional(), regularOpeningHours: z.unknown().optional(), businessStatus: z.string().optional() });
const searchResponseSchema = z.object({ places: z.array(placeSchema).optional().default([]), nextPageToken: z.string().optional().nullable() });
const SEARCH_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location,nextPageToken";
const DIRECT_SEARCH_FIELD_MASK = `${SEARCH_FIELD_MASK},places.primaryType`;
const DETAIL_FIELD_MASK = "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours,businessStatus";
const DIRECT_ENDPOINT = "https://places.googleapis.com/v1";
export const RAPIDAPI_TEXT_SEARCH_URL = "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText";
export const RAPIDAPI_PLACE_DETAILS_BASE_URL = "https://google-map-places-new-v2.p.rapidapi.com/v1/places";
export const RAPIDAPI_EXPECTED_HOST = "google-map-places-new-v2.p.rapidapi.com";

function normalize(place: z.infer<typeof placeSchema>, input: SearchBusinessesInput): BusinessSearchResult | null {
  const name = place.displayName?.text.trim();
  if (!name) return null;
  const location = place.location ?? null; const locationQuality = assessLocationQuality(searchAreas[input.location], location, place.formattedAddress ?? null);
  return { provider: "google_places", externalId: place.id, name, address: place.formattedAddress ?? null, type: place.primaryType ?? null, location, locationQuality };
}
function parseSearchResponse(body: unknown, transport: PlacesTransport, durationMs: number, input: SearchBusinessesInput): { accepted: BusinessSearchResult[]; nextPageToken: string | null } {
  const parsed = searchResponseSchema.safeParse(body);
  if (!parsed.success) throw new PlacesTransportError(transport, "text_search", "MALFORMED_RESPONSE", 200, "MALFORMED_RESPONSE", "Invalid Places response shape", durationMs);
  const unique = new Map<string, BusinessSearchResult>();
  for (const place of parsed.data.places.map((value) => normalize(value, input))) if (place && !unique.has(place.externalId)) unique.set(place.externalId, place);
  const providerCount = unique.size; const accepted = [...unique.values()].filter((place) => place.locationQuality.accepted);
  console.info(JSON.stringify({ event: "discovery_geo_filter", location: input.location, providerCount, acceptedCount: accepted.length, rejectedCount: providerCount - accepted.length }));
  return { accepted, nextPageToken: parsed.data.nextPageToken || null };
}
export function searchBody(input: SearchBusinessesOptions) { const area = searchAreas[input.location]; return { textQuery: input.customQuery || buildTextQuery(input), languageCode: "vi", regionCode: "VN", locationRestriction: { rectangle: deriveSearchViewport(area) }, pageSize: Math.min(20, input.maxResults), ...(input.pageToken ? { pageToken: input.pageToken } : {}) }; }
const safeHeader = (headers: Headers, name: string) => headers.get(name)?.slice(0, 100) || null;
export function parseQuotaHeaders(headers: Headers): ProviderQuotaSnapshot | null {
  const groups = {
    requests: ["x-ratelimit-requests-limit", "x-ratelimit-requests-remaining", "x-ratelimit-requests-reset"],
    generic: ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"],
    rapidFreePlansHardLimit: ["x-rate-limit-rapid-free-plans-hard-limit-limit", "x-rate-limit-rapid-free-plans-hard-limit-remaining", "x-rate-limit-rapid-free-plans-hard-limit-reset"],
  } as const;
  const result: ProviderQuotaSnapshot = {};
  for (const [key, names] of Object.entries(groups) as [keyof ProviderQuotaSnapshot, readonly [string, string, string]][]) {
    const metric = { limit: safeHeader(headers, names[0]), remaining: safeHeader(headers, names[1]), reset: safeHeader(headers, names[2]) };
    if (metric.limit || metric.remaining || metric.reset) result[key] = metric;
  }
  return Object.keys(result).length ? result : null;
}
export function providerErrorKind(status: number): ProviderErrorKind {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401 || status === 403) return "AUTH";
  if (status === 429) return "QUOTA";
  if (status >= 500) return "PROVIDER";
  return "PROVIDER";
}
function safeProviderMessage(value: string | null) {
  if (!value) return null;
  return value.replace(/(api[_-]?key|token|authorization|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]").slice(0, 300);
}
async function errorDetails(response: Response) {
  try { const body = await response.json() as { error?: { code?: string | number; message?: string }; code?: string | number; message?: string }; return { code: String(body.error?.code ?? body.code ?? response.status), message: body.error?.message ?? body.message ?? response.statusText }; }
  catch { return { code: String(response.status), message: response.statusText || null }; }
}
function normalizeDetails(place: z.infer<typeof detailsSchema>): PlaceDetailsEnrichment {
  return { sourceSystem: "google_places", externalId: place.id, name: place.displayName?.text.trim() || null, address: place.formattedAddress ?? null, phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null, internationalPhone: place.internationalPhoneNumber ?? null, websiteUrl: place.websiteUri ?? null, rating: place.rating ?? null, reviewCount: place.userRatingCount ?? null, openingHours: place.regularOpeningHours ?? null, businessStatus: place.businessStatus ?? null };
}
function validPlaceId(id: string) { return /^[A-Za-z0-9_-]{5,200}$/.test(id); }
function timeoutError(transport: PlacesTransport, operation: "text_search" | "details", started: number, error: unknown): never {
  const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
  throw new PlacesTransportError(transport, operation, timedOut ? "TIMEOUT" : "NETWORK", null, timedOut ? "TIMEOUT" : "NETWORK_ERROR", timedOut ? "Request timed out" : "Network request failed", Math.round(performance.now() - started));
}

export class RapidApiPlacesTransport implements PlacesTransportAdapter {
  readonly name = "rapidapi" as const;
  lastDiagnostics: ProviderDiagnostics | null = null;
  constructor(private readonly apiKey = process.env.RAPIDAPI_KEY, private readonly host = process.env.RAPIDAPI_HOST, private readonly request: typeof fetch = fetch) {}
  async searchWithPagination(input: SearchBusinessesOptions): Promise<SearchResultWithPagination> {
    if (!this.apiKey) throw new PlacesConfigError(this.name, "RAPIDAPI_KEY missing");
    if (!this.host) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST missing");
    if (this.host !== RAPIDAPI_EXPECTED_HOST) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST invalid");
    const started = performance.now();
    let response: Response;
    try { response = await this.request(RAPIDAPI_TEXT_SEARCH_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-RapidAPI-Key": this.apiKey, "X-RapidAPI-Host": this.host, "X-Goog-FieldMask": SEARCH_FIELD_MASK }, body: JSON.stringify(searchBody(input)), cache: "no-store", signal: AbortSignal.timeout(12000) }); } catch (error) { timeoutError(this.name, "text_search", started, error); }
    const duration = Math.round(performance.now() - started);
    const quota = parseQuotaHeaders(response.headers);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "text_search", providerErrorKind(response.status), response.status, error.code, safeProviderMessage(error.message), duration, quota); }
    let body: unknown;
    try { body = await response.json(); } catch { throw new PlacesTransportError(this.name, "text_search", "MALFORMED_RESPONSE", response.status, "MALFORMED_RESPONSE", "Response is not JSON", duration, quota); }
    const { accepted, nextPageToken } = parseSearchResponse(body, this.name, duration, input);
    const results = accepted.slice(0, input.maxResults);
    this.lastDiagnostics = { transport: this.name, operation: "text_search", status: "SUCCESS", errorKind: null, httpStatus: response.status, providerCode: null, providerMessage: null, durationMs: duration, quota };
    return { results, nextPageToken };
  }
  async search(input: SearchBusinessesOptions) {
    const res = await this.searchWithPagination(input);
    return res.results;
  }
  async getDetails(id: string) {
    if (!validPlaceId(id)) throw new PlacesTransportError(this.name, "details", "BAD_REQUEST", null, "INVALID_PLACE_ID", "Invalid Google Place ID", 0);
    if (!this.apiKey) throw new PlacesConfigError(this.name, "RAPIDAPI_KEY missing");
    if (!this.host) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST missing");
    if (this.host !== RAPIDAPI_EXPECTED_HOST) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST invalid");
    const started = performance.now(); let response: Response;
    try { response = await this.request(`${RAPIDAPI_PLACE_DETAILS_BASE_URL}/${encodeURIComponent(id)}`, { headers: { "X-RapidAPI-Key": this.apiKey, "X-RapidAPI-Host": this.host, "X-Goog-FieldMask": DETAIL_FIELD_MASK }, cache: "no-store", signal: AbortSignal.timeout(12000) }); } catch (error) { timeoutError(this.name, "details", started, error); }
    const duration = Math.round(performance.now() - started);
    const quota = parseQuotaHeaders(response.headers);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "details", providerErrorKind(response.status), response.status, error.code, safeProviderMessage(error.message), duration, quota); }
    let body: unknown; try { body = await response.json(); } catch { throw new PlacesTransportError(this.name, "details", "MALFORMED_RESPONSE", response.status, "MALFORMED_RESPONSE", "Response is not JSON", duration, quota); }
    const parsed = detailsSchema.safeParse(body);
    if (!parsed.success) throw new PlacesTransportError(this.name, "details", "MALFORMED_RESPONSE", response.status, "MALFORMED_RESPONSE", "Invalid Place Details response shape", duration, quota);
    this.lastDiagnostics = { transport: this.name, operation: "details", status: "SUCCESS", errorKind: null, httpStatus: response.status, providerCode: null, providerMessage: null, durationMs: duration, quota };
    return normalizeDetails(parsed.data);
  }
}

export class DirectGooglePlacesTransport implements PlacesTransportAdapter {
  readonly name = "direct-google" as const;
  lastDiagnostics: ProviderDiagnostics | null = null;
  constructor(private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY, private readonly request: typeof fetch = fetch) {}
  async searchWithPagination(input: SearchBusinessesOptions): Promise<SearchResultWithPagination> {
    if (!this.apiKey) throw new PlacesConfigError(this.name, "GOOGLE_MAPS_API_KEY missing");
    const started = performance.now();
    const response = await this.request(`${DIRECT_ENDPOINT}/places:searchText`, { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": DIRECT_SEARCH_FIELD_MASK }, body: JSON.stringify(searchBody(input)), cache: "no-store", signal: AbortSignal.timeout(12000) });
    const duration = Math.round(performance.now() - started);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "text_search", providerErrorKind(response.status), response.status, error.code, safeProviderMessage(error.message), duration); }
    const body = await response.json();
    const { accepted, nextPageToken } = parseSearchResponse(body, this.name, duration, input);
    const results = accepted.slice(0, input.maxResults);
    this.lastDiagnostics = { transport: this.name, operation: "text_search", status: "SUCCESS", errorKind: null, httpStatus: response.status, providerCode: null, providerMessage: null, durationMs: duration, quota: null };
    return { results, nextPageToken };
  }
  async search(input: SearchBusinessesOptions) {
    const res = await this.searchWithPagination(input);
    return res.results;
  }
  async getDetails(id: string) {
    if (!validPlaceId(id)) throw new PlacesTransportError(this.name, "details", "BAD_REQUEST", null, "INVALID_PLACE_ID", "Invalid Google Place ID", 0);
    if (!this.apiKey) throw new PlacesConfigError(this.name, "GOOGLE_MAPS_API_KEY missing");
    const started = performance.now(); let response: Response;
    try { response = await this.request(`${DIRECT_ENDPOINT}/places/${encodeURIComponent(id)}`, { headers: { "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": DETAIL_FIELD_MASK }, cache: "no-store", signal: AbortSignal.timeout(12000) }); } catch (error) { timeoutError(this.name, "details", started, error); }
    const duration = Math.round(performance.now() - started);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "details", providerErrorKind(response.status), response.status, error.code, safeProviderMessage(error.message), duration); }
    const parsed = detailsSchema.safeParse(await response.json());
    if (!parsed.success) throw new PlacesTransportError(this.name, "details", "MALFORMED_RESPONSE", response.status, "MALFORMED_RESPONSE", "Invalid Place Details response shape", duration);
    this.lastDiagnostics = { transport: this.name, operation: "details", status: "SUCCESS", errorKind: null, httpStatus: response.status, providerCode: null, providerMessage: null, durationMs: duration, quota: null };
    return normalizeDetails(parsed.data);
  }
}

export class PlacesService implements BusinessDiscoveryProvider {
  constructor(private readonly transport: PlacesTransportAdapter = createPlacesTransport()) {}
  get transportName() { return this.transport.name; }
  get lastDiagnostics() { return this.transport.lastDiagnostics; }
  search(input: SearchBusinessesOptions) { return this.transport.search(input); }
  searchWithPagination(input: SearchBusinessesOptions) { return this.transport.searchWithPagination(input); }
  getDetails(id: string) { return this.transport.getDetails(id); }
}

export function createPlacesTransport(transport = process.env.PLACES_TRANSPORT): PlacesTransportAdapter {
  if (!transport || transport === "rapidapi") return new RapidApiPlacesTransport();
  if (transport === "direct-google") return new DirectGooglePlacesTransport();
  throw new PlacesConfigError("rapidapi", "PLACES_TRANSPORT invalid");
}
export const createSearchTransport = createPlacesTransport;
