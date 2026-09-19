import { db } from "../../lib/db";
import { isObviousPreviewBot, isValidPublicToken, viewerHash } from "../public-audit/security";
import { demoBriefSchema, demoContentSchema, demoPresetSchema } from "./types";

export async function getPublicDemo(slug: string, client = db) {
  if (!isValidPublicToken(slug)) return { kind: "NOT_FOUND" as const };
  const demo = await client.leadDemo.findUnique({ where: { publicSlug: slug }, select: { id: true, leadId: true, status: true, brief: true, content: true, preset: true, conceptImagePath: true, conceptStatus: true } });
  if (!demo || demo.status !== "PUBLISHED") return { kind: "NOT_FOUND" as const };
  const brief = demoBriefSchema.safeParse(demo.brief); const content = demoContentSchema.safeParse(demo.content); const preset = demoPresetSchema.safeParse(demo.preset);
  if (!brief.success || !content.success || !preset.success) return { kind: "NOT_FOUND" as const };
  const report = await client.publicAuditReport.findFirst({ where: { leadId: demo.leadId, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { createdAt: "desc" }, select: { publicToken: true } });
  return { kind: "PUBLISHED" as const, demoId: demo.id, brief: brief.data, content: content.data, preset: preset.data, conceptImagePath: demo.conceptStatus === "READY" ? demo.conceptImagePath : null, reportToken: report?.publicToken ?? null };
}
export async function recordPublicDemoView(input: { slug: string; viewerId: string; userAgent: string | null; referrer: string | null; now?: Date }, client = db) {
  if (isObviousPreviewBot(input.userAgent)) return { counted: false, reason: "BOT" as const };
  const now = input.now ?? new Date(); const access = await getPublicDemo(input.slug, client); if (access.kind !== "PUBLISHED") return { counted: false, reason: "NOT_FOUND" as const };
  const hash = viewerHash(input.viewerId); const since = new Date(now.getTime() - 30 * 60_000);
  const recent = await client.leadDemoView.findFirst({ where: { demoId: access.demoId, viewerHash: hash, viewedAt: { gte: since } }, select: { id: true } });
  if (recent) return { counted: false, reason: "DEDUPED" as const };
  await client.$transaction(async (tx) => { await tx.leadDemoView.create({ data: { demoId: access.demoId, viewerHash: hash, userAgent: input.userAgent?.slice(0,300) || null, referrer: input.referrer?.slice(0,500) || null, viewedAt: now } }); await tx.leadDemo.updateMany({ where: { id: access.demoId, firstViewedAt: null }, data: { firstViewedAt: now } }); await tx.leadDemo.update({ where: { id: access.demoId }, data: { viewCount: { increment: 1 }, lastViewedAt: now } }); });
  return { counted: true, reason: "COUNTED" as const };
}
