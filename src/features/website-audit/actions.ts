"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { auditWebsite } from "./audit";
import { WebsiteAuditError, type AuditErrorCode } from "./types";

const idSchema = z.string().uuid();

export async function runWebsiteAudit(form: FormData) {
  const actor = await requireActor(); const leadId = idSchema.parse(String(form.get("leadId") ?? ""));
  const lead = await db.lead.findFirst({ where: { id: leadId, workspaceId: actor.workspaceId, archivedAt: null }, select: { id: true, websiteUrl: true } });
  if (!lead) return;
  if (!lead.websiteUrl) redirect(`/leads/${lead.id}?auditError=INVALID_URL`);
  const scan = await db.websiteScan.create({ data: { workspaceId: actor.workspaceId, leadId: lead.id, requestedUrl: lead.websiteUrl, status: "PENDING" } });
  try {
    const result = await auditWebsite(lead.websiteUrl);
    await db.websiteScan.update({ where: { id: scan.id }, data: { finalUrl: result.checks.reachability.finalUrl, status: "SUCCESS", httpStatus: result.checks.reachability.httpStatus, durationMs: result.checks.reachability.durationMs, redirectCount: result.checks.reachability.redirectCount, checks: result.checks as unknown as Prisma.InputJsonValue, findings: result.findings as unknown as Prisma.InputJsonValue, finishedAt: new Date() } });
    console.info(JSON.stringify({ event: "website_audit", status: "success", workspace_id: actor.workspaceId, lead_id: lead.id, scan_id: scan.id, http_status: result.checks.reachability.httpStatus, duration_ms: result.checks.reachability.durationMs }));
  } catch (error) {
    const code: AuditErrorCode = error instanceof WebsiteAuditError ? error.code : "FETCH_FAILED";
    await db.websiteScan.update({ where: { id: scan.id }, data: { status: "FAILED", errorCode: code, finishedAt: new Date() } });
    console.error(JSON.stringify({ event: "website_audit", status: "failed", workspace_id: actor.workspaceId, lead_id: lead.id, scan_id: scan.id, error_code: code }));
    revalidatePath(`/leads/${lead.id}`);
    redirect(`/leads/${lead.id}?auditError=${code}`);
  }
  revalidatePath(`/leads/${lead.id}`);
  redirect(`/leads/${lead.id}?audit=complete`);
}
