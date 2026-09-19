"use server";

import { ActivityType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { generateOpportunities } from "../opportunities/engine";
import { calculatePriorityScore } from "../priority-score/score";
import { buildSalesStrategy } from "../sales-assistant/strategy";
import type { AuditChecks, AuditFinding } from "../website-audit/types";
import { createPublicToken } from "./security";
import { buildPublicAuditSnapshot } from "./snapshot";

const id = (form: FormData, name: string) => z.string().uuid().parse(String(form.get(name) ?? ""));
export async function createPublicAuditReport(form: FormData) {
  const actor = await requireActor(); const leadId = id(form, "leadId");
  const lead = await db.lead.findFirst({ where: { id: leadId, workspaceId: actor.workspaceId, archivedAt: null }, include: { websiteScans: { where: { status: "SUCCESS" }, orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!lead) redirect("/leads");
  const scan = lead.websiteScans[0]; const checks = (scan?.checks as AuditChecks | null) ?? null; const findings = (scan?.findings as AuditFinding[] | null) ?? [];
  const opportunities = generateOpportunities({ websiteUrl: lead.websiteUrl, phone: lead.phone, industry: lead.industry }, scan ? { status: scan.status, checks, findings } : null);
  const priority = calculatePriorityScore({ lead, opportunityResult: opportunities, hasSuccessfulAudit: Boolean(scan) }); const strategy = buildSalesStrategy(lead, opportunities, priority);
  let snapshot;
  try { snapshot = buildPublicAuditSnapshot(lead, scan ? { status: scan.status, createdAt: scan.createdAt, checks } : null, opportunities, strategy); }
  catch { redirect(`/leads/${lead.id}?reportError=AUDIT_REQUIRED`); }
  const token = createPublicToken(); const expiresAt = new Date(Date.now() + 30 * 86400_000);
  await db.$transaction(async (tx) => { await tx.publicAuditReport.create({ data: { workspaceId: actor.workspaceId, leadId: lead.id, publicToken: token, snapshot: snapshot as unknown as Prisma.InputJsonValue, expiresAt } }); await tx.activity.create({ data: { leadId: lead.id, userId: actor.user.id, type: ActivityType.NOTE, summary: "Đã tạo báo cáo chia sẻ" } }); });
  revalidatePath(`/leads/${lead.id}`); redirect(`/leads/${lead.id}?report=created`);
}

export async function revokePublicAuditReport(form: FormData) {
  const actor = await requireActor(); const reportId = id(form, "reportId"); const leadId = id(form, "leadId");
  await db.publicAuditReport.updateMany({ where: { id: reportId, leadId, workspaceId: actor.workspaceId, status: "ACTIVE" }, data: { status: "REVOKED", revokedAt: new Date() } });
  revalidatePath(`/leads/${leadId}`); redirect(`/leads/${leadId}?report=revoked`);
}

export async function markPublicAuditReportSent(form: FormData) {
  const actor = await requireActor(); const reportId = id(form, "reportId"); const leadId = id(form, "leadId");
  const report = await db.publicAuditReport.findFirst({ where: { id: reportId, leadId, workspaceId: actor.workspaceId }, select: { id: true } });
  if (report) await db.activity.create({ data: { leadId, userId: actor.user.id, type: ActivityType.AUDIT_SENT, summary: "Đã đánh dấu báo cáo chia sẻ là đã gửi", metadata: { reportId } } });
  revalidatePath(`/leads/${leadId}`); redirect(`/leads/${leadId}?report=sent`);
}
