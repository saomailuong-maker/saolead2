"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { generateOpportunities } from "../opportunities/engine";
import { calculatePriorityScore } from "../priority-score/score";
import type { AuditChecks, AuditFinding } from "../website-audit/types";
import { buildVerifiedContext, contextDigest } from "./context";
import { checkDraftClaims } from "./guardrails";
import { generateDraftWithOpenAI } from "./openai";
import { buildSalesStrategy } from "./strategy";
import { SalesAssistantError, salesDraftSchema, salesStrategySchema } from "./types";
import { checkCustomerFacingTone } from "./tone";

const idSchema = z.string().uuid();
const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
function errorCode(error: unknown) { return error instanceof SalesAssistantError ? error.code : "PROVIDER"; }

export async function generateOutreachDraft(form: FormData) {
  const actor = await requireActor(); const leadId = idSchema.parse(value(form, "leadId"));
  const lead = await db.lead.findFirst({ where: { id: leadId, workspaceId: actor.workspaceId, archivedAt: null }, include: { websiteScans: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!lead) redirect("/leads");
  const scan = lead.websiteScans[0]; const checks = (scan?.checks as AuditChecks | null) ?? null; const findings = (scan?.findings as AuditFinding[] | null) ?? [];
  const opportunities = generateOpportunities({ websiteUrl: lead.websiteUrl, phone: lead.phone, industry: lead.industry }, scan ? { status: scan.status, checks, findings } : null);
  const priority = calculatePriorityScore({ lead, opportunityResult: opportunities, hasSuccessfulAudit: scan?.status === "SUCCESS" });
  const strategy = buildSalesStrategy(lead, opportunities, priority);
  const context = buildVerifiedContext(lead, priority, opportunities, strategy, scan ? { status: scan.status, checks, findings } : null);
  try {
    const generated = await generateDraftWithOpenAI(context, strategy);
    await db.outreachDraft.create({ data: { workspaceId: actor.workspaceId, leadId: lead.id, provider: "openai", model: generated.model, strategy: strategy as unknown as Prisma.InputJsonValue, inputDigest: contextDigest(context), output: generated.draft as unknown as Prisma.InputJsonValue, status: "VALID" } });
  } catch (error) { redirect(`/leads/${lead.id}?salesError=${errorCode(error)}`); }
  redirect(`/leads/${lead.id}?sales=generated`);
}

export async function saveOutreachDraft(form: FormData) {
  const actor = await requireActor(); const draftId = idSchema.parse(value(form, "draftId")); const leadId = idSchema.parse(value(form, "leadId"));
  const existing = await db.outreachDraft.findFirst({ where: { id: draftId, leadId, workspaceId: actor.workspaceId } });
  if (!existing) redirect(`/leads/${leadId}?salesError=NOT_FOUND`);
  const current = salesDraftSchema.safeParse(existing.output); const strategy = salesStrategySchema.safeParse(existing.strategy);
  if (!current.success || !strategy.success) redirect(`/leads/${leadId}?salesError=MALFORMED_OUTPUT`);
  const messageVariants = current.data.messageVariants.map((variant) => ({ style: variant.style, zaloFacebookDm: value(form, `${variant.style}-zaloFacebookDm`), phoneOpener: value(form, `${variant.style}-phoneOpener`), email: value(form, `${variant.style}-email`) }));
  const edited = salesDraftSchema.safeParse({ ...current.data, messageVariants, reasoningSummary: value(form, "reasoningSummary") });
  if (!edited.success) redirect(`/leads/${leadId}?salesError=MALFORMED_OUTPUT`);
  if (!checkDraftClaims(edited.data, strategy.data).valid) redirect(`/leads/${leadId}?salesError=UNSUPPORTED_CLAIMS`);
  if (!checkCustomerFacingTone(edited.data).valid) redirect(`/leads/${leadId}?salesError=MALFORMED_OUTPUT`);
  await db.outreachDraft.updateMany({ where: { id: draftId, leadId, workspaceId: actor.workspaceId }, data: { output: edited.data as unknown as Prisma.InputJsonValue, status: "EDITED" } });
  redirect(`/leads/${leadId}?sales=saved`);
}
