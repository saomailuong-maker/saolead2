import type { SearchBusinessesInput } from "./query";
import { buildTextQuery } from "./query";

export type BusinessSearchResult = { provider: "google_places"; externalId: string; name: string; address: string | null; type: string | null };
export interface BusinessDiscoveryProvider { search(input: SearchBusinessesInput): Promise<BusinessSearchResult[]>; getPlace(id: string): Promise<BusinessSearchResult | null> }

export class MissingGoogleKeyError extends Error { constructor() { super("GOOGLE_MAPS_API_KEY missing"); } }
export class GooglePlacesError extends Error { constructor(message: string) { super(message); } }
const SEARCH_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.primaryType,nextPageToken";
const DETAIL_FIELD_MASK = "id,displayName,formattedAddress,primaryType";
const ENDPOINT = "https://places.googleapis.com/v1";

type GooglePlace = { id?: string; displayName?: { text?: string }; formattedAddress?: string; primaryType?: string };
function normalize(place: GooglePlace): BusinessSearchResult | null {
  if (!place.id || !place.displayName?.text) return null;
  return { provider: "google_places", externalId: place.id, name: place.displayName.text, address: place.formattedAddress ?? null, type: place.primaryType ?? null };
}

export class GooglePlacesDiscoveryProvider implements BusinessDiscoveryProvider {
  constructor(private readonly apiKey = process.env.GOOGLE_MAPS_API_KEY, private readonly request: typeof fetch = fetch) {}
  private key() { if (!this.apiKey) throw new MissingGoogleKeyError(); return this.apiKey; }

  async search(input: SearchBusinessesInput): Promise<BusinessSearchResult[]> {
    const key = this.key(); const results: BusinessSearchResult[] = []; let pageToken: string | undefined;
    do {
      const response = await this.request(`${ENDPOINT}/places:searchText`, { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": SEARCH_FIELD_MASK }, body: JSON.stringify({ textQuery: buildTextQuery(input), languageCode: "vi", regionCode: "VN", pageSize: Math.min(20, input.maxResults - results.length), ...(pageToken ? { pageToken } : {}) }), cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new GooglePlacesError(`Google Places search HTTP ${response.status}`);
      const body = await response.json() as { places?: GooglePlace[]; nextPageToken?: string };
      results.push(...(body.places ?? []).map(normalize).filter((place): place is BusinessSearchResult => place !== null));
      pageToken = body.nextPageToken;
    } while (pageToken && results.length < input.maxResults);
    return [...new Map(results.map((place) => [place.externalId, place])).values()].slice(0, input.maxResults);
  }

  async getPlace(id: string): Promise<BusinessSearchResult | null> {
    if (!/^[A-Za-z0-9_-]{5,200}$/.test(id)) return null;
    const response = await this.request(`${ENDPOINT}/places/${encodeURIComponent(id)}`, { headers: { "X-Goog-Api-Key": this.key(), "X-Goog-FieldMask": DETAIL_FIELD_MASK }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (response.status === 404) return null;
    if (!response.ok) throw new GooglePlacesError(`Google Places detail HTTP ${response.status}`);
    return normalize(await response.json() as GooglePlace);
  }
}
