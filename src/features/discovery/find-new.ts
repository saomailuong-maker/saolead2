import type { BusinessDiscoveryProvider, BusinessSearchResult, ProviderDiagnostics } from "./provider";
import { areaSubLocalities, buildDiversifiedQuery, type SearchBusinessesInput } from "./query";
import { getSeenPlaceIds } from "./seen-places";

export type FindNewLeadsStats = {
  totalReturned: number;
  newFound: number;
  skippedSeen: number;
  requestsUsed: number;
};

export type FindNewLeadsResult = {
  newPlaces: BusinessSearchResult[];
  stats: FindNewLeadsStats;
  nextPageToken: string | null;
  diagnostics: ProviderDiagnostics | null;
};

export interface FindNewLeadsOptions {
  workspaceId: string;
  input: SearchBusinessesInput;
  provider: BusinessDiscoveryProvider;
  maxRequestsLimit?: number; // Hard quota guardrail, default 3
  targetNewCount?: number;
}

export async function executeFindNewLeads(options: FindNewLeadsOptions): Promise<FindNewLeadsResult> {
  const { workspaceId, input, provider, maxRequestsLimit = 3, targetNewCount = input.maxResults } = options;

  const previouslySeenIds = await getSeenPlaceIds(workspaceId, input.location, input.industry);
  const seenPlaceIds = new Set<string>(previouslySeenIds);
  const uniqueSeenInRun = new Set<string>();

  const newPlaces: BusinessSearchResult[] = [];
  let requestsUsed = 0;
  let totalReturned = 0;
  let skippedSeen = 0;
  let currentPageToken: string | null = null;
  let lastDiagnostics: ProviderDiagnostics | null = null;

  const subLocalities = areaSubLocalities[input.location] || [];
  let subLocalityIndex = 0;

  while (newPlaces.length < targetNewCount && requestsUsed < maxRequestsLimit) {
    let customQuery: string | undefined = undefined;
    let pageToken: string | undefined = undefined;

    if (requestsUsed === 0) {
      // First request: standard query, no page token
      customQuery = undefined;
      pageToken = undefined;
    } else if (currentPageToken) {
      // Prioritize Google Places nextPageToken if available
      pageToken = currentPageToken;
      customQuery = undefined;
    } else if (subLocalityIndex < subLocalities.length) {
      // Fallback to query diversification by sub-locality
      const sub = subLocalities[subLocalityIndex];
      subLocalityIndex++;
      customQuery = buildDiversifiedQuery(input, sub);
      pageToken = undefined;
    } else {
      // No more pagination tokens and no more sub-localities
      break;
    }

    requestsUsed++;
    let batch;
    try {
      batch = await provider.searchWithPagination({
        ...input,
        customQuery,
        pageToken,
      });
      lastDiagnostics = provider.lastDiagnostics || null;
    } catch (err) {
      // If error occurs on subsequent requests but we already found some new places, return them gracefully
      lastDiagnostics = provider.lastDiagnostics || null;
      if (requestsUsed === 1) {
        throw err;
      }
      break;
    }

    totalReturned += batch.results.length;
    currentPageToken = batch.nextPageToken;

    let newlyAddedInBatch = 0;
    for (const place of batch.results) {
      if (seenPlaceIds.has(place.externalId) || uniqueSeenInRun.has(place.externalId)) {
        skippedSeen++;
      } else {
        seenPlaceIds.add(place.externalId);
        uniqueSeenInRun.add(place.externalId);
        newPlaces.push(place);
        newlyAddedInBatch++;
        if (newPlaces.length >= targetNewCount) {
          break;
        }
      }
    }

    // If batch returned 0 results or nothing new, and no nextPageToken, continue to next subLocality or break
    if (newlyAddedInBatch === 0 && !currentPageToken && subLocalityIndex >= subLocalities.length) {
      break;
    }
  }

  return {
    newPlaces,
    stats: {
      totalReturned,
      newFound: newPlaces.length,
      skippedSeen,
      requestsUsed,
    },
    nextPageToken: currentPageToken,
    diagnostics: lastDiagnostics,
  };
}
