"use server";

import { InboxStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { normalizeName } from "../../lib/lead";
import { PlacesConfigError, PlacesService, PlacesTransportError, businessSearchResultSchema, type BusinessSearchResult, type ProviderDiagnostics } from "./provider";
import { diagnosticsFromError, providerDiagnosticsSchema } from "./diagnostics";
import { buildTextQuery, searchInputSchema } from "./query";
import { canAddToInbox } from "./inbox";
import { recordSeenPlaces, resolvePlacesStatus, type EnrichedSearchResult, type PlaceDiscoveryStatus } from "./seen-places";
import { executeFindNewLeads, type FindNewLeadsStats } from "./find-new";

export type { PlaceDiscoveryStatus, EnrichedSearchResult };

export type SearchState = {
  error?: "provider" | "input";
  diagnostics?: ProviderDiagnostics;
  sessionId?: string;
  location?: string;
  industry?: string;
  mode?: "STANDARD" | "FIND_NEW";
  searchStats?: FindNewLeadsStats;
  results: EnrichedSearchResult[];
};

const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

async function saveProviderLog(workspaceId: string, diagnostics: ProviderDiagnostics, searchSessionId?: string) {
  try {
    await db.providerRequestLog.create({
      data: {
        workspaceId,
        searchSessionId,
        transport: diagnostics.transport,
        operation: diagnostics.operation,
        status: diagnostics.status,
        errorKind: diagnostics.errorKind,
        httpStatus: diagnostics.httpStatus,
        providerCode: diagnostics.providerCode,
        providerMessage: diagnostics.providerMessage,
        durationMs: diagnostics.durationMs,
        ...(diagnostics.quota ? { quota: diagnostics.quota as Prisma.InputJsonValue } : {}),
      },
    });
  } catch (error) {
    console.error(JSON.stringify({ event: "provider_telemetry_persist_failed", message: error instanceof Error ? error.message.slice(0, 120) : "unknown" }));
  }
}

export type SearchHistoryItem = {
  id: string;
  location: string;
  industry: string;
  query: string;
  resultCount: number;
  mode: string | null;
  searchStats: FindNewLeadsStats | null;
  createdAt: Date;
};

export async function getRecentSearchSessions(limit = 8): Promise<SearchHistoryItem[]> {
  const actor = await requireActor();
  const sessions = await db.searchSession.findMany({
    where: {
      workspaceId: actor.workspaceId,
      provider: "google_places",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      location: true,
      industry: true,
      query: true,
      resultCount: true,
      mode: true,
      searchStats: true,
      createdAt: true,
    },
  });
  return sessions.map((s) => ({
    ...s,
    searchStats: (s.searchStats as FindNewLeadsStats | null) ?? null,
  }));
}

export async function restoreSearchSession(sessionId: string): Promise<SearchState> {
  const actor = await requireActor();
  const parsedId = z.string().uuid().safeParse(sessionId);
  if (!parsedId.success) return { results: [], error: "input" };
  const session = await db.searchSession.findFirst({
    where: { id: parsedId.data, workspaceId: actor.workspaceId, provider: "google_places" },
  });
  if (!session) return { results: [] };
  const parsedResults = z.array(businessSearchResultSchema).safeParse(session.resultsJson);
  if (!parsedResults.success) return { sessionId: session.id, results: [] };
  const log = await db.providerRequestLog.findFirst({
    where: { workspaceId: actor.workspaceId, searchSessionId: session.id },
    orderBy: { createdAt: "desc" },
  });
  const parsedDiagnostics = providerDiagnosticsSchema.safeParse(
    log
      ? {
          transport: log.transport,
          operation: log.operation,
          status: log.status,
          errorKind: log.errorKind,
          httpStatus: log.httpStatus,
          providerCode: log.providerCode,
          providerMessage: log.providerMessage,
          durationMs: log.durationMs,
          quota: log.quota,
        }
      : null
  );
  const enrichedResults = await resolvePlacesStatus(actor.workspaceId, parsedResults.data);
  return {
    sessionId: session.id,
    location: session.location,
    industry: session.industry,
    mode: (session.mode as "STANDARD" | "FIND_NEW") ?? "STANDARD",
    searchStats: (session.searchStats as FindNewLeadsStats | null) ?? undefined,
    ...(parsedDiagnostics.success ? { diagnostics: parsedDiagnostics.data } : {}),
    results: enrichedResults,
  };
}

export async function searchBusinesses(_previous: SearchState, form: FormData): Promise<SearchState> {
  const actor = await requireActor();
  const actionType = field(form, "actionType") === "find_new" ? "find_new" : "standard";
  const parsed = searchInputSchema.safeParse({
    location: field(form, "location"),
    industry: field(form, "industry"),
    keyword: field(form, "keyword"),
    maxResults: field(form, "maxResults"),
  });
  if (!parsed.success) return { results: [], error: "input" };

  try {
    const provider = new PlacesService();

    if (actionType === "find_new") {
      const findResult = await executeFindNewLeads({
        workspaceId: actor.workspaceId,
        input: parsed.data,
        provider,
        maxRequestsLimit: 3,
        targetNewCount: parsed.data.maxResults,
      });

      const session = await db.searchSession.create({
        data: {
          workspaceId: actor.workspaceId,
          provider: "google_places",
          query: buildTextQuery(parsed.data),
          location: parsed.data.location,
          industry: parsed.data.industry,
          resultCount: findResult.newPlaces.length,
          resultPlaceIds: findResult.newPlaces.map((r) => r.externalId),
          resultsJson: findResult.newPlaces,
          nextPageToken: findResult.nextPageToken,
          mode: "FIND_NEW",
          searchStats: findResult.stats as Prisma.InputJsonValue,
        },
      });

      const diagnostics = findResult.diagnostics ?? {
        transport: provider.transportName,
        operation: "text_search" as const,
        status: "SUCCESS" as const,
        errorKind: null,
        httpStatus: 200,
        providerCode: null,
        providerMessage: null,
        durationMs: null,
        quota: null,
      };
      await saveProviderLog(actor.workspaceId, diagnostics, session.id);

      await recordSeenPlaces(actor.workspaceId, findResult.newPlaces, parsed.data.location, parsed.data.industry, session.id);
      const enrichedResults = await resolvePlacesStatus(
        actor.workspaceId,
        findResult.newPlaces,
        new Set(findResult.newPlaces.map((p) => p.externalId))
      );

      console.info(JSON.stringify({ event: "provider_request", provider: "google_places", transport: provider.transportName, operation: "text_search", mode: "find_new", workspace_id: actor.workspaceId, result_count: findResult.newPlaces.length, stats: findResult.stats, status: "ok" }));
      return {
        sessionId: session.id,
        location: parsed.data.location,
        industry: parsed.data.industry,
        mode: "FIND_NEW",
        searchStats: findResult.stats,
        diagnostics,
        results: enrichedResults,
      };
    }

    // Standard search
    const searchRes = await provider.searchWithPagination(parsed.data);
    const results = searchRes.results;
    const session = await db.searchSession.create({
      data: {
        workspaceId: actor.workspaceId,
        provider: "google_places",
        query: buildTextQuery(parsed.data),
        location: parsed.data.location,
        industry: parsed.data.industry,
        resultCount: results.length,
        resultPlaceIds: results.map((r) => r.externalId),
        resultsJson: results,
        nextPageToken: searchRes.nextPageToken,
        mode: "STANDARD",
      },
    });

    const diagnostics = provider.lastDiagnostics ?? {
      transport: provider.transportName,
      operation: "text_search" as const,
      status: "SUCCESS" as const,
      errorKind: null,
      httpStatus: 200,
      providerCode: null,
      providerMessage: null,
      durationMs: null,
      quota: null,
    };
    await saveProviderLog(actor.workspaceId, diagnostics, session.id);

    await recordSeenPlaces(actor.workspaceId, results, parsed.data.location, parsed.data.industry, session.id);
    const enrichedResults = await resolvePlacesStatus(actor.workspaceId, results);

    console.info(JSON.stringify({ event: "provider_request", provider: "google_places", transport: provider.transportName, operation: "text_search", mode: "standard", workspace_id: actor.workspaceId, result_count: results.length, status: "ok" }));
    return {
      sessionId: session.id,
      location: parsed.data.location,
      industry: parsed.data.industry,
      mode: "STANDARD",
      diagnostics,
      results: enrichedResults,
    };
  } catch (error) {
    const diagnostics = diagnosticsFromError(error);
    await saveProviderLog(actor.workspaceId, diagnostics);
    const detail = error instanceof PlacesTransportError ? { transport: error.transport, operation: error.operation, http_status: error.httpStatus, provider_code: error.providerCode, provider_message: error.providerMessage, duration_ms: error.durationMs } : { transport: error instanceof PlacesConfigError ? error.transport : "unknown", operation: "text_search", http_status: null, provider_code: error instanceof PlacesConfigError ? "CONFIG_ERROR" : "UNKNOWN", provider_message: error instanceof Error ? error.message : null, duration_ms: null };
    console.error(JSON.stringify({ event: "provider_request", provider: "google_places", workspace_id: actor.workspaceId, status: "error", ...detail }));
    return { results: [], error: "provider", diagnostics };
  }
}


export async function addToInbox(form: FormData) {
  const actor = await requireActor();
  const sessionId = z.string().uuid().parse(field(form, "sessionId"));
  const externalId = z.string().min(5).max(200).regex(/^[A-Za-z0-9_-]+$/).parse(field(form, "externalId"));
  const session = await db.searchSession.findFirst({ where: { id: sessionId, workspaceId: actor.workspaceId, provider: "google_places" } });
  if (!session || !canAddToInbox(session.resultPlaceIds, externalId, false)) redirect("/discover?error=session");
  const existing = await db.discoveredBusiness.findUnique({ where: { provider_externalId: { provider: "google_places", externalId } }, select: { id: true } });
  if (!canAddToInbox(session.resultPlaceIds, externalId, Boolean(existing))) redirect("/lead-inbox?existing=1");
  const basic = Array.isArray(session.resultsJson) ? session.resultsJson.find((value): value is BusinessSearchResult => Boolean(value && typeof value === "object" && "externalId" in value && value.externalId === externalId && "name" in value && typeof value.name === "string")) : undefined;
  let details: Awaited<ReturnType<PlacesService["getDetails"]>> | null = null;
  let detailsErrorCode: string | null = null;
  const provider = new PlacesService();
  try {
    details = await provider.getDetails(externalId);
    console.info(JSON.stringify({ event: "provider_request", provider: "google_places", transport: provider.transportName, operation: "details", external_id: externalId, status: "ok" }));
  } catch (error) {
    detailsErrorCode = error instanceof PlacesTransportError ? error.providerCode : error instanceof PlacesConfigError ? "CONFIG_ERROR" : "UNKNOWN";
    const detail = error instanceof PlacesTransportError ? { transport: error.transport, operation: error.operation, http_status: error.httpStatus, provider_code: error.providerCode, provider_message: error.providerMessage, duration_ms: error.durationMs } : { transport: error instanceof PlacesConfigError ? error.transport : "unknown", operation: "details", http_status: null, provider_code: detailsErrorCode, provider_message: error instanceof Error ? error.message : null, duration_ms: null };
    console.error(JSON.stringify({ event: "provider_request", provider: "google_places", external_id: externalId, status: "error", ...detail }));
  }
  try {
    await db.discoveredBusiness.create({ data: { workspaceId: actor.workspaceId, provider: "google_places", externalId, name: details?.name ?? basic?.name ?? null, address: details?.address ?? basic?.address ?? null, industry: session.industry, location: session.location, phone: details?.phone ?? null, websiteUrl: details?.websiteUrl ?? null, rating: details?.rating ?? null, reviewCount: details?.reviewCount ?? null, ...(details?.openingHours != null ? { openingHours: details.openingHours as Prisma.InputJsonValue } : {}), businessStatus: details?.businessStatus ?? null, detailsStatus: details ? "SUCCESS" : "FAILED", detailsFetchedAt: new Date(), detailsErrorCode, searchSessionId: session.id } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
    redirect("/lead-inbox?existing=1");
  }
  revalidatePath("/lead-inbox");
  redirect("/lead-inbox?added=1");
}

export async function setInboxStatus(form: FormData) {
  const actor = await requireActor();
  const id = z.string().uuid().parse(field(form, "id"));
  const status = z.enum(["QUALIFIED", "REJECTED"]).parse(field(form, "status")) as InboxStatus;
  await db.discoveredBusiness.updateMany({ where: { id, workspaceId: actor.workspaceId, status: { in: ["UNREVIEWED", "QUALIFIED", "REJECTED"] } }, data: { status } });
  revalidatePath("/lead-inbox");
}

export async function createCrmLeadFromInbox(form: FormData) {
  const actor = await requireActor();
  const id = z.string().uuid().parse(field(form, "id"));
  const businessName = z.string().trim().min(2).max(200).parse(field(form, "businessName"));
  const locationText = z.string().trim().max(250).parse(field(form, "locationText"));
  const item = await db.discoveredBusiness.findFirst({ where: { id, workspaceId: actor.workspaceId, status: "QUALIFIED" } });
  if (!item) redirect("/lead-inbox?error=state");
  const lead = await db.$transaction(async (tx) => {
    const claimed = await tx.discoveredBusiness.updateMany({ where: { id, workspaceId: actor.workspaceId, status: "QUALIFIED" }, data: { status: "CRM_CREATED" } });
    if (!claimed.count) return null;
    const created = await tx.lead.create({ data: { workspaceId: actor.workspaceId, ownerUserId: actor.user.id, businessName, businessNameNormalized: normalizeName(businessName), industry: item.industry, locationText: locationText || item.address || item.location, phone: item.phone, websiteUrl: item.websiteUrl, sourceType: "google_places_user_confirmed", sourceExternalId: item.externalId } });
    await tx.discoveredBusiness.update({ where: { id }, data: { crmLeadId: created.id } });
    return created;
  });
  if (!lead) redirect("/lead-inbox?error=state");
  revalidatePath("/lead-inbox"); revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function bulkImportToCrm(input: {
  sessionId: string;
  externalIds: string[];
}): Promise<{ success: boolean; importedCount: number; skippedCount: number; leadIds: string[]; error?: string }> {
  const actor = await requireActor();
  const sessionId = z.string().uuid().parse(input.sessionId);
  const externalIds = z.array(z.string().min(5).max(200)).min(1).max(50).parse(input.externalIds);

  const session = await db.searchSession.findFirst({
    where: { id: sessionId, workspaceId: actor.workspaceId, provider: "google_places" },
  });
  if (!session) return { success: false, importedCount: 0, skippedCount: 0, leadIds: [], error: "Session không hợp lệ" };

  const sessionResults = Array.isArray(session.resultsJson)
    ? (session.resultsJson as unknown as BusinessSearchResult[])
    : [];

  const existingLeads = await db.lead.findMany({
    where: {
      workspaceId: actor.workspaceId,
      sourceExternalId: { in: externalIds },
    },
    select: { sourceExternalId: true },
  });
  const existingSet = new Set(existingLeads.map((l) => l.sourceExternalId).filter(Boolean));

  const toImportIds = externalIds.filter((id) => !existingSet.has(id));
  const skippedCount = externalIds.length - toImportIds.length;

  if (toImportIds.length === 0) {
    return { success: true, importedCount: 0, skippedCount, leadIds: [] };
  }

  const provider = new PlacesService();
  const leadIds: string[] = [];

  for (const externalId of toImportIds) {
    const basic = sessionResults.find((r) => r && typeof r === "object" && r.externalId === externalId);
    let details: Awaited<ReturnType<PlacesService["getDetails"]>> | null = null;
    let detailsErrorCode: string | null = null;

    try {
      details = await provider.getDetails(externalId);
    } catch (err) {
      detailsErrorCode = err instanceof PlacesTransportError ? err.providerCode : "DETAILS_FAILED";
    }

    const businessName = details?.name ?? basic?.name ?? "Doanh nghiệp chưa đặt tên";
    const address = details?.address ?? basic?.address ?? session.location;
    const phone = details?.phone ?? null;
    const websiteUrl = details?.websiteUrl ?? null;

    try {
      const disc = await db.discoveredBusiness.upsert({
        where: { provider_externalId: { provider: "google_places", externalId } },
        update: {
          status: "CRM_CREATED",
          phone: phone ?? undefined,
          websiteUrl: websiteUrl ?? undefined,
          rating: details?.rating ?? undefined,
          reviewCount: details?.reviewCount ?? undefined,
          detailsStatus: details ? "SUCCESS" : "FAILED",
        },
        create: {
          workspaceId: actor.workspaceId,
          provider: "google_places",
          externalId,
          name: businessName,
          address,
          industry: session.industry,
          location: session.location,
          phone,
          websiteUrl,
          rating: details?.rating ?? null,
          reviewCount: details?.reviewCount ?? null,
          businessStatus: details?.businessStatus ?? null,
          detailsStatus: details ? "SUCCESS" : "FAILED",
          detailsFetchedAt: new Date(),
          detailsErrorCode,
          status: "CRM_CREATED",
          searchSessionId: session.id,
        },
      });

      const createdLead = await db.lead.create({
        data: {
          workspaceId: actor.workspaceId,
          ownerUserId: actor.user.id,
          businessName,
          businessNameNormalized: normalizeName(businessName),
          industry: session.industry,
          locationText: address,
          phone,
          websiteUrl,
          sourceType: "google_places_bulk_import",
          sourceExternalId: externalId,
          stage: "NEW",
        },
      });

      await db.discoveredBusiness.update({
        where: { id: disc.id },
        data: { crmLeadId: createdLead.id },
      });

      leadIds.push(createdLead.id);
    } catch (err) {
      console.error(`Failed to import lead for ${externalId}:`, err);
    }
  }

  revalidatePath("/discover");
  revalidatePath("/lead-inbox");
  revalidatePath("/leads");
  revalidatePath("/outreach");

  return {
    success: true,
    importedCount: leadIds.length,
    skippedCount,
    leadIds,
  };
}
