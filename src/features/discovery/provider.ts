import { z } from "zod";
import type { SearchBusinessesInput } from "./query";
import { buildTextQuery } from "./query";

export type PlacesTransport = "rapidapi" | "direct-google";
export type BusinessSearchResult = { provider: "google_places"; externalId: string; name: string; address: string | null; type: string | null };
export type PlaceDetailsEnrichment = { sourceSystem: "google_places"; externalId: string; name: string | null; address: string | null; phone: string | null; internationalPhone: string | null; websiteUrl: string | null; rating: number | null; reviewCount: number | null; openingHours: unknown | null; businessStatus: string | null };
export interface BusinessDiscoveryProvider { search(input: SearchBusinessesInput): Promise<BusinessSearchResult[]>; getDetails(id: string): Promise<PlaceDetailsEnrichment> }
interface PlacesTransportAdapter { readonly name: PlacesTransport; search(input: SearchBusinessesInput): Promise<BusinessSearchResult[]>; getDetails(id: string): Promise<PlaceDetailsEnrichment> }

export class PlacesConfigError extends Error { constructor(public readonly transport: PlacesTransport, message: string) { super(message); this.name = "PlacesConfigError"; } }
export class PlacesTransportError extends Error {
  constructor(public readonly transport: PlacesTransport, public readonly operation: "text_search" | "details", public readonly httpStatus: number | null, public readonly providerCode: string | null, public readonly providerMessage: string | null, public readonly durationMs: number) { super(`${transport} ${operation} failed`); this.name = "PlacesTransportError"; }
}

const placeSchema = z.object({ id: z.string().min(1), displayName: z.object({ text: z.string() }).optional(), formattedAddress: z.string().optional(), primaryType: z.string().optional() });
const detailsSchema = placeSchema.extend({ nationalPhoneNumber: z.string().optional(), internationalPhoneNumber: z.string().optional(), websiteUri: z.string().url().optional(), rating: z.number().min(0).max(5).optional(), userRatingCount: z.number().int().nonnegative().optional(), regularOpeningHours: z.unknown().optional(), businessStatus: z.string().optional() });
const searchResponseSchema = z.object({ places: z.array(placeSchema).optional().default([]) });
const SEARCH_FIELD_MASK = "places.id,places.displayName,places.formattedAddress";
const DIRECT_SEARCH_FIELD_MASK = `${SEARCH_FIELD_MASK},places.primaryType`;
const DETAIL_FIELD_MASK = "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours,businessStatus";
const DIRECT_ENDPOINT = "https://places.googleapis.com/v1";
export const RAPIDAPI_TEXT_SEARCH_URL = "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText";
export const RAPIDAPI_PLACE_DETAILS_BASE_URL = "https://google-map-places-new-v2.p.rapidapi.com/v1/places";
export const RAPIDAPI_EXPECTED_HOST = "google-map-places-new-v2.p.rapidapi.com";

function normalize(place: z.infer<typeof placeSchema>): BusinessSearchResult | null {
  const name = place.displayName?.text.trim();
  if (!name) return null;
  return { provider: "google_places", externalId: place.id, name, address: place.formattedAddress ?? null, type: place.primaryType ?? null };
}
function normalizedPlaces(body: unknown, transport: PlacesTransport, durationMs: number) {
  const parsed = searchResponseSchema.safeParse(body);
  if (!parsed.success) throw new PlacesTransportError(transport, "text_search", 200, "MALFORMED_RESPONSE", "Invalid Places response shape", durationMs);
  const unique = new Map<string, BusinessSearchResult>();
  for (const place of parsed.data.places.map(normalize)) if (place && !unique.has(place.externalId)) unique.set(place.externalId, place);
  return [...unique.values()];
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
  const code = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "TIMEOUT" : "NETWORK_ERROR";
  throw new PlacesTransportError(transport, operation, null, code, error instanceof Error ? error.message : "Network request failed", Math.round(performance.now() - started));
}

export class RapidApiPlacesTransport implements PlacesTransportAdapter {
  readonly name = "rapidapi" as const;
  constructor(private readonly apiKey = process.env.RAPIDAPI_KEY, private readonly host = process.env.RAPIDAPI_HOST, private readonly request: typeof fetch = fetch) {}
  async search(input: SearchBusinessesInput) {
    if (!this.apiKey) throw new PlacesConfigError(this.name, "RAPIDAPI_KEY missing");
    if (!this.host) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST missing");
    if (this.host !== RAPIDAPI_EXPECTED_HOST) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST invalid");
    const started = performance.now();
    let response: Response;
    try { response = await this.request(RAPIDAPI_TEXT_SEARCH_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-RapidAPI-Key": this.apiKey, "X-RapidAPI-Host": this.host, "X-Goog-FieldMask": SEARCH_FIELD_MASK }, body: JSON.stringify({ textQuery: buildTextQuery(input), pageSize: Math.min(20, input.maxResults) }), cache: "no-store", signal: AbortSignal.timeout(12000) }); } catch (error) { timeoutError(this.name, "text_search", started, error); }
    const duration = Math.round(performance.now() - started);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "text_search", response.status, error.code, error.message, duration); }
    let body: unknown;
    try { body = await response.json(); } catch { throw new PlacesTransportError(this.name, "text_search", response.status, "MALFORMED_RESPONSE", "Response is not JSON", duration); }
    return normalizedPlaces(body, this.name, duration).slice(0, 20);
  }
  async getDetails(id: string) {
    if (!validPlaceId(id)) throw new PlacesTransportError(this.name, "details", null, "INVALID_PLACE_ID", "Invalid Google Place ID", 0);
    if (!this.apiKey) throw new PlacesConfigError(this.name, "RAPIDAPI_KEY missing");
    if (!this.host) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST missing");
    if (this.host !== RAPIDAPI_EXPECTED_HOST) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST invalid");
    const started = performance.now(); let response: Response;
    try { response = await this.request(`${RAPIDAPI_PLACE_DETAILS_BASE_URL}/${encodeURIComponent(id)}`, { headers: { "X-RapidAPI-Key": this.apiKey, "X-RapidAPI-Host": this.host, "X-Goog-FieldMask": DETAIL_FIELD_MASK }, cache: "no-store", signal: AbortSignal.timeout(12000) }); } catch (error) { timeoutError(this.name, "details", started, error); }
    const duration = Math.round(performance.now() - started);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "details", response.status, error.code, error.message, duration); }
    let body: unknown; try { body = await response.json(); } catch { throw new PlacesTransportError(this.name, "details", response.status, "MALFORMED_RESPONSE", "Response is not JSON", duration); }
    const parsed = detailsSchema.safeParse(body);
    if (!parsed.success) throw new PlacesTransportError(this.name, "details", response.status, "MALFORMED_RESPONSE", "Invalid Place Details response shape", duration);
    return normalizeDetails(parsed.data);
  }
}

export class DirectGooglePlacesTransport implements PlacesTransportAdapter {
  readonly name = "direct-google" as const;
  constructor(private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY, private readonly request: typeof fetch = fetch) {}
  async search(input: SearchBusinessesInput) {
    if (!this.apiKey) throw new PlacesConfigError(this.name, "GOOGLE_MAPS_API_KEY missing");
    const started = performance.now();
    const response = await this.request(`${DIRECT_ENDPOINT}/places:searchText`, { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": DIRECT_SEARCH_FIELD_MASK }, body: JSON.stringify({ textQuery: buildTextQuery(input), languageCode: "vi", regionCode: "VN", pageSize: Math.min(20, input.maxResults) }), cache: "no-store", signal: AbortSignal.timeout(12000) });
    const duration = Math.round(performance.now() - started);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "text_search", response.status, error.code, error.message, duration); }
    return normalizedPlaces(await response.json(), this.name, duration).slice(0, 20);
  }
  async getDetails(id: string) {
    if (!validPlaceId(id)) throw new PlacesTransportError(this.name, "details", null, "INVALID_PLACE_ID", "Invalid Google Place ID", 0);
    if (!this.apiKey) throw new PlacesConfigError(this.name, "GOOGLE_MAPS_API_KEY missing");
    const started = performance.now(); let response: Response;
    try { response = await this.request(`${DIRECT_ENDPOINT}/places/${encodeURIComponent(id)}`, { headers: { "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": DETAIL_FIELD_MASK }, cache: "no-store", signal: AbortSignal.timeout(12000) }); } catch (error) { timeoutError(this.name, "details", started, error); }
    const duration = Math.round(performance.now() - started);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "details", response.status, error.code, error.message, duration); }
    const parsed = detailsSchema.safeParse(await response.json());
    if (!parsed.success) throw new PlacesTransportError(this.name, "details", response.status, "MALFORMED_RESPONSE", "Invalid Place Details response shape", duration);
    return normalizeDetails(parsed.data);
  }
}

export class PlacesService implements BusinessDiscoveryProvider {
  constructor(private readonly transport: PlacesTransportAdapter = createPlacesTransport()) {}
  get transportName() { return this.transport.name; }
  search(input: SearchBusinessesInput) { return this.transport.search(input); }
  getDetails(id: string) { return this.transport.getDetails(id); }
}

export function createPlacesTransport(transport = process.env.PLACES_TRANSPORT): PlacesTransportAdapter {
  if (!transport || transport === "rapidapi") return new RapidApiPlacesTransport();
  if (transport === "direct-google") return new DirectGooglePlacesTransport();
  throw new PlacesConfigError("rapidapi", "PLACES_TRANSPORT invalid");
}
export const createSearchTransport = createPlacesTransport;
