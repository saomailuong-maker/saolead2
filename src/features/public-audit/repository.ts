import { db } from "../../lib/db";
import { publicAuditSnapshotSchema } from "./types";
import { isObviousPreviewBot, isValidPublicToken, viewerHash } from "./security";

export type PublicReportAccess = { kind: "ACTIVE"; reportId: string; snapshot: ReturnType<typeof publicAuditSnapshotSchema.parse>; demoSlug: string | null; conceptImagePath: string | null } | { kind: "NOT_FOUND" | "REVOKED" | "EXPIRED" };
export async function getPublicReport(token: string, now = new Date(), client = db): Promise<PublicReportAccess> {
  if (!isValidPublicToken(token)) return { kind: "NOT_FOUND" };
  const report = await client.publicAuditReport.findUnique({ where: { publicToken: token }, select: { id: true, leadId: true, status: true, expiresAt: true, snapshot: true } });
  if (!report) return { kind: "NOT_FOUND" }; if (report.status === "REVOKED") return { kind: "REVOKED" };
  if (report.status === "EXPIRED" || (report.expiresAt && report.expiresAt <= now)) return { kind: "EXPIRED" };
  const snapshot = publicAuditSnapshotSchema.safeParse(report.snapshot); if (!snapshot.success) return { kind: "NOT_FOUND" };
  const demo = "leadDemo" in client && client.leadDemo ? await client.leadDemo.findFirst({ where: { leadId: report.leadId, status: "PUBLISHED", publicSlug: { not: null } }, orderBy: { publishedAt: "desc" }, select: { publicSlug: true, conceptImagePath: true, conceptStatus: true } }) : null;
  return { kind: "ACTIVE", reportId: report.id, snapshot: snapshot.data, demoSlug: demo?.publicSlug ?? null, conceptImagePath: demo?.conceptStatus === "SUCCESS" ? demo.conceptImagePath : null };
}

export async function recordPublicReportView(input: { token: string; viewerId: string; userAgent: string | null; referrer: string | null; now?: Date }, client = db) {
  if (isObviousPreviewBot(input.userAgent)) return { counted: false, reason: "BOT" as const };
  const now = input.now ?? new Date(); const access = await getPublicReport(input.token, now, client); if (access.kind !== "ACTIVE") return { counted: false, reason: access.kind };
  const hash = viewerHash(input.viewerId); const since = new Date(now.getTime() - 30 * 60_000);
  const recent = await client.publicAuditReportView.findFirst({ where: { reportId: access.reportId, viewerHash: hash, viewedAt: { gte: since } }, select: { id: true } });
  if (recent) return { counted: false, reason: "DEDUPED" as const };
  await client.$transaction(async (tx) => { await tx.publicAuditReportView.create({ data: { reportId: access.reportId, viewerHash: hash, userAgent: input.userAgent?.slice(0, 300) || null, referrer: input.referrer?.slice(0, 500) || null, viewedAt: now } }); await tx.publicAuditReport.updateMany({ where: { id: access.reportId, firstViewedAt: null }, data: { firstViewedAt: now } }); await tx.publicAuditReport.update({ where: { id: access.reportId }, data: { viewCount: { increment: 1 }, lastViewedAt: now } }); });
  return { counted: true, reason: "COUNTED" as const };
}
