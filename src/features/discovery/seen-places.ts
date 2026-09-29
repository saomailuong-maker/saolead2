import { db } from "../../lib/db";
import type { BusinessSearchResult } from "./provider";

export type PlaceDiscoveryStatus = "CRM" | "INBOX" | "REJECTED" | "SEEN_BEFORE" | "NEW";

export type EnrichedSearchResult = BusinessSearchResult & {
  discoveryStatus?: PlaceDiscoveryStatus;
  seenCount?: number;
  inInbox: boolean;
};

export async function getSeenPlaceIds(workspaceId: string, location?: string, industry?: string): Promise<Set<string>> {
  if (!db.discoverySeenPlace?.findMany) return new Set();
  const records = await db.discoverySeenPlace.findMany({
    where: {
      workspaceId,
      provider: "google_places",
      ...(location ? { location } : {}),
      ...(industry ? { industry } : {}),
    },
    select: { externalId: true },
  });
  return new Set(records.map((r) => r.externalId));
}

export async function recordSeenPlaces(
  workspaceId: string,
  places: BusinessSearchResult[],
  location: string,
  industry: string,
  sessionId?: string
): Promise<Map<string, number>> {
  if (places.length === 0 || !db.discoverySeenPlace) return new Map();

  const placeIds = places.map((p) => p.externalId);
  const existing = await db.discoverySeenPlace.findMany({
    where: {
      workspaceId,
      provider: "google_places",
      externalId: { in: placeIds },
    },
  });
  const existingMap = new Map(existing.map((e) => [e.externalId, e]));
  const seenCountMap = new Map<string, number>();
  const now = new Date();

  await Promise.all(
    places.map(async (place) => {
      const prev = existingMap.get(place.externalId);
      if (prev) {
        const newCount = prev.seenCount + 1;
        seenCountMap.set(place.externalId, newCount);
        return db.discoverySeenPlace.update({
          where: { id: prev.id },
          data: {
            seenCount: newCount,
            lastSeenAt: now,
            name: place.name || prev.name,
            address: place.address || prev.address,
            lastSearchSessionId: sessionId || prev.lastSearchSessionId,
          },
        });
      } else {
        seenCountMap.set(place.externalId, 1);
        return db.discoverySeenPlace.create({
          data: {
            workspaceId,
            provider: "google_places",
            externalId: place.externalId,
            name: place.name,
            address: place.address,
            location,
            industry,
            seenCount: 1,
            firstSeenAt: now,
            lastSeenAt: now,
            lastSearchSessionId: sessionId,
          },
        });
      }
    })
  );

  return seenCountMap;
}

export async function resolvePlacesStatus(
  workspaceId: string,
  places: BusinessSearchResult[],
  knownNewIds?: Set<string>,
  providedSeenMap?: Map<string, number>
): Promise<EnrichedSearchResult[]> {
  if (places.length === 0) return [];
  const placeIds = places.map((p) => p.externalId);

  const [crmLeads, inboxItems, seenPlaces] = await Promise.all([
    db.lead?.findMany
      ? db.lead.findMany({
          where: {
            workspaceId,
            sourceExternalId: { in: placeIds },
          },
          select: { sourceExternalId: true },
        })
      : Promise.resolve([]),
    db.discoveredBusiness?.findMany
      ? db.discoveredBusiness.findMany({
          where: {
            workspaceId,
            provider: "google_places",
            externalId: { in: placeIds },
          },
          select: { externalId: true, status: true },
        })
      : Promise.resolve([]),
    providedSeenMap || !db.discoverySeenPlace?.findMany
      ? Promise.resolve([])
      : db.discoverySeenPlace.findMany({
          where: {
            workspaceId,
            provider: "google_places",
            externalId: { in: placeIds },
          },
          select: { externalId: true, seenCount: true },
        }),
  ]);

  const crmSet = new Set(crmLeads.map((l) => l.sourceExternalId).filter(Boolean) as string[]);
  const inboxMap = new Map(inboxItems.map((i) => [i.externalId, i.status]));
  const seenMap = providedSeenMap ?? new Map(seenPlaces.map((s) => [s.externalId, s.seenCount]));

  return places.map((place) => {
    const id = place.externalId;
    const seenCount = seenMap.get(id) ?? 1;
    const hasInbox = inboxMap.has(id);
    const inboxStatus = inboxMap.get(id);
    let discoveryStatus: PlaceDiscoveryStatus;

    if (crmSet.has(id) || inboxStatus === "CRM_CREATED") {
      discoveryStatus = "CRM";
    } else if (inboxStatus === "REJECTED") {
      discoveryStatus = "REJECTED";
    } else if (hasInbox) {
      discoveryStatus = "INBOX";
    } else if (knownNewIds ? knownNewIds.has(id) : seenCount <= 1) {
      discoveryStatus = "NEW";
    } else {
      discoveryStatus = "SEEN_BEFORE";
    }

    const inInbox = hasInbox && inboxStatus !== "REJECTED";

    return {
      ...place,
      discoveryStatus,
      seenCount,
      inInbox,
    };
  });
}
