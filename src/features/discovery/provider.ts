import { z } from "zod";
import type { SearchBusinessesInput } from "./query";
import { buildTextQuery } from "./query";

export type PlacesTransport = "rapidapi" | "direct-google";
export type BusinessSearchResult = { provider: "google_places"; externalId: string; name: string; address: string | null; type: string | null };
export interface BusinessDiscoveryProvider { search(input: SearchBusinessesInput): Promise<BusinessSearchResult[]>; getPlace(id: string): Promise<BusinessSearchResult | null> }
interface PlacesSearchTransport { readonly name: PlacesTransport; search(input: SearchBusinessesInput): Promise<BusinessSearchResult[]> }

export class PlacesConfigError extends Error { constructor(public readonly transport: PlacesTransport, message: string) { super(message); this.name = "PlacesConfigError"; } }
export class PlacesTransportError extends Error {
  constructor(public readonly transport: PlacesTransport, public readonly operation: "text_search" | "details", public readonly httpStatus: number | null, public readonly providerCode: string | null, public readonly providerMessage: string | null, public readonly durationMs: number) { super(`${transport} ${operation} failed`); this.name = "PlacesTransportError"; }
}

const placeSchema = z.object({ id: z.string().min(1), displayName: z.object({ text: z.string() }).optional(), formattedAddress: z.string().optional(), primaryType: z.string().optional() });
const searchResponseSchema = z.object({ places: z.array(placeSchema).optional().default([]) });
const SEARCH_FIELD_MASK = "places.id,places.displayName,places.formattedAddress";
const DIRECT_SEARCH_FIELD_MASK = `${SEARCH_FIELD_MASK},places.primaryType`;
const DETAIL_FIELD_MASK = "id,displayName,formattedAddress,primaryType";
const DIRECT_ENDPOINT = "https://places.googleapis.com/v1";
export const RAPIDAPI_TEXT_SEARCH_URL = "https://google-map-places-new-v2.p.rapidapi.com/v1/places:searchText";
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

export class RapidApiPlacesTransport implements PlacesSearchTransport {
  readonly name = "rapidapi" as const;
  constructor(private readonly apiKey = process.env.RAPIDAPI_KEY, private readonly host = process.env.RAPIDAPI_HOST, private readonly request: typeof fetch = fetch) {}
  async search(input: SearchBusinessesInput) {
    if (!this.apiKey) throw new PlacesConfigError(this.name, "RAPIDAPI_KEY missing");
    if (!this.host) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST missing");
    if (this.host !== RAPIDAPI_EXPECTED_HOST) throw new PlacesConfigError(this.name, "RAPIDAPI_HOST invalid");
    const started = performance.now();
    const response = await this.request(RAPIDAPI_TEXT_SEARCH_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-RapidAPI-Key": this.apiKey, "X-RapidAPI-Host": this.host, "X-Goog-FieldMask": SEARCH_FIELD_MASK }, body: JSON.stringify({ textQuery: buildTextQuery(input), pageSize: Math.min(20, input.maxResults) }), cache: "no-store", signal: AbortSignal.timeout(12000) });
    const duration = Math.round(performance.now() - started);
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError(this.name, "text_search", response.status, error.code, error.message, duration); }
    let body: unknown;
    try { body = await response.json(); } catch { throw new PlacesTransportError(this.name, "text_search", response.status, "MALFORMED_RESPONSE", "Response is not JSON", duration); }
    return normalizedPlaces(body, this.name, duration).slice(0, 20);
  }
}

export class DirectGooglePlacesTransport implements PlacesSearchTransport {
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
}

export class PlacesService implements BusinessDiscoveryProvider {
  constructor(private readonly transport: PlacesSearchTransport = createSearchTransport(), private readonly directApiKey = process.env.GOOGLE_MAPS_API_KEY, private readonly request: typeof fetch = fetch) {}
  get transportName() { return this.transport.name; }
  search(input: SearchBusinessesInput) { return this.transport.search(input); }
  async getPlace(id: string): Promise<BusinessSearchResult | null> {
    if (!/^[A-Za-z0-9_-]{5,200}$/.test(id) || !this.directApiKey) return null;
    const started = performance.now();
    const response = await this.request(`${DIRECT_ENDPOINT}/places/${encodeURIComponent(id)}`, { headers: { "X-Goog-Api-Key": this.directApiKey, "X-Goog-FieldMask": DETAIL_FIELD_MASK }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    const duration = Math.round(performance.now() - started);
    if (response.status === 404) return null;
    if (!response.ok) { const error = await errorDetails(response); throw new PlacesTransportError("direct-google", "details", response.status, error.code, error.message, duration); }
    const parsed = placeSchema.safeParse(await response.json());
    if (!parsed.success) throw new PlacesTransportError("direct-google", "details", response.status, "MALFORMED_RESPONSE", "Invalid Place response shape", duration);
    return normalize(parsed.data);
  }
}

export function createSearchTransport(transport = process.env.PLACES_TRANSPORT): PlacesSearchTransport {
  if (!transport || transport === "rapidapi") return new RapidApiPlacesTransport();
  if (transport === "direct-google") return new DirectGooglePlacesTransport();
  throw new PlacesConfigError("rapidapi", "PLACES_TRANSPORT invalid");
}
