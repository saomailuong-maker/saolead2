"use server";

import { InboxStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { normalizeName } from "../../lib/lead";
import { GooglePlacesDiscoveryProvider, MissingGoogleKeyError, type BusinessSearchResult } from "./provider";
import { buildTextQuery, searchInputSchema } from "./query";
import { canAddToInbox } from "./inbox";

export type SearchState = { error?: "key" | "provider" | "input"; sessionId?: string; results: (BusinessSearchResult & { inInbox: boolean })[] };
const field = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function searchBusinesses(_previous: SearchState, form: FormData): Promise<SearchState> {
  const actor = await requireActor();
  const parsed = searchInputSchema.safeParse({ location: field(form, "location"), industry: field(form, "industry"), keyword: field(form, "keyword"), maxResults: field(form, "maxResults") });
  if (!parsed.success) return { results: [], error: "input" };
  try {
    const provider = new GooglePlacesDiscoveryProvider();
    const results = await provider.search(parsed.data);
    const session = await db.searchSession.create({ data: { workspaceId: actor.workspaceId, provider: "google_places", query: buildTextQuery(parsed.data), location: parsed.data.location, industry: parsed.data.industry, resultCount: results.length, resultPlaceIds: results.map((r) => r.externalId) } });
    const existing = await db.discoveredBusiness.findMany({ where: { workspaceId: actor.workspaceId, provider: "google_places", externalId: { in: results.map((r) => r.externalId) } }, select: { externalId: true } });
    const seen = new Set(existing.map((r) => r.externalId));
    console.info(JSON.stringify({ event: "provider_request", provider: "google_places", operation: "text_search", workspace_id: actor.workspaceId, result_count: results.length, status: "ok" }));
    return { sessionId: session.id, results: results.map((r) => ({ ...r, inInbox: seen.has(r.externalId) })) };
  } catch (error) {
    console.error(JSON.stringify({ event: "provider_request", provider: "google_places", operation: "text_search", workspace_id: actor.workspaceId, status: "error", error: error instanceof Error ? error.name : "unknown" }));
    return { results: [], error: error instanceof MissingGoogleKeyError ? "key" : "provider" };
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
  try {
    await db.discoveredBusiness.create({ data: { workspaceId: actor.workspaceId, provider: "google_places", externalId, industry: session.industry, location: session.location, searchSessionId: session.id } });
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
    const created = await tx.lead.create({ data: { workspaceId: actor.workspaceId, ownerUserId: actor.user.id, businessName, businessNameNormalized: normalizeName(businessName), industry: item.industry, locationText: locationText || item.location, sourceType: "google_places_user_confirmed", sourceExternalId: item.externalId } });
    await tx.discoveredBusiness.update({ where: { id }, data: { crmLeadId: created.id } });
    return created;
  });
  if (!lead) redirect("/lead-inbox?error=state");
  revalidatePath("/lead-inbox"); revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}
