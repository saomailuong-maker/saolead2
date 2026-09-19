import Link from "next/link";
import { Stage } from "@prisma/client";
import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { stageLabel, stages } from "../../lib/lead";
import { generateOpportunities } from "../../features/opportunities/engine";
import { calculatePriorityScore, sortByPriority } from "../../features/priority-score/score";
import type { PriorityBand } from "../../features/priority-score/types";
import type { AuditChecks, AuditFinding } from "../../features/website-audit/types";

const priorityBands: PriorityBand[] = ["HOT", "WARM", "LOW"];

export default async function Leads({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; industry?: string; sort?: string; priority?: string }> }) {
  const { workspaceId } = await requireActor(); const p = await searchParams;
  const stage = stages.includes(p.stage as Stage) ? p.stage as Stage : undefined;
  const priority = priorityBands.includes(p.priority as PriorityBand) ? p.priority as PriorityBand : undefined;
  const sort = p.sort === "priority" ? "priority" : "updated";
  const leads = await db.lead.findMany({ where: { workspaceId, archivedAt: null, ...(stage ? { stage } : {}), ...(p.q ? { businessName: { contains: p.q, mode: "insensitive" as const } } : {}), ...(p.industry ? { industry: { contains: p.industry, mode: "insensitive" as const } } : {}) }, orderBy: { updatedAt: "desc" }, take: 200, include: { tasks: { where: { status: "OPEN" }, orderBy: { dueAt: "asc" }, take: 1 }, websiteScans: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const scored = leads.map((lead) => {
    const scan = lead.websiteScans[0]; const checks = scan?.checks as AuditChecks | null; const findings = (scan?.findings as AuditFinding[] | null) ?? [];
    const opportunityResult = generateOpportunities({ websiteUrl: lead.websiteUrl, phone: lead.phone, industry: lead.industry }, scan ? { status: scan.status, checks, findings } : null);
    const score = calculatePriorityScore({ lead, opportunityResult, hasSuccessfulAudit: scan?.status === "SUCCESS" });
    return { ...lead, opportunityCount: opportunityResult.opportunities.length, score };
  });
  const filtered = scored.filter((lead) => !priority || lead.score.band === priority);
  const displayed = sort === "priority" ? sortByPriority(filtered) : filtered;
  return <div className="space-y-5"><div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Leads</h1><p className="text-slate-500 mt-1">Danh sách khách hàng trong CRM</p></div><Link href="/leads/new" className="btn">+ Thêm lead</Link></div><form className="card p-4 grid md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3"><input name="q" placeholder="Tìm tên doanh nghiệp" defaultValue={p.q}/><input name="industry" placeholder="Ngành" defaultValue={p.industry}/><select name="stage" defaultValue={stage || ""}><option value="">Mọi trạng thái</option>{stages.map((value) => <option key={value} value={value}>{stageLabel[value]}</option>)}</select><select name="priority" defaultValue={priority || ""}><option value="">Mọi mức ưu tiên</option><option value="HOT">HOT</option><option value="WARM">WARM</option><option value="LOW">LOW</option></select><select name="sort" defaultValue={sort}><option value="updated">Cập nhật gần nhất</option><option value="priority">Ưu tiên cao nhất</option></select><button className="btn">Lọc</button></form><div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-500 text-left"><tr>{["Doanh nghiệp", "Ngành", "Địa điểm", "Trạng thái", "Ưu tiên", "Cơ hội", "Follow-up"].map((value) => <th className="p-4" key={value}>{value}</th>)}</tr></thead><tbody className="divide-y">{displayed.map((lead) => <tr key={lead.id} className="hover:bg-slate-50"><td className="p-4 font-semibold"><Link href={`/leads/${lead.id}`} className="hover:text-blue-600">{lead.businessName}</Link></td><td className="p-4">{lead.industry || "—"}</td><td className="p-4">{lead.locationText || "—"}</td><td className="p-4">{stageLabel[lead.stage]}</td><td className="p-4"><strong>{lead.score.total}</strong> {lead.score.band}</td><td className="p-4">{lead.opportunityCount} cơ hội</td><td className="p-4">{lead.tasks[0]?.dueAt.toLocaleDateString("vi-VN") || "—"}</td></tr>)}</tbody></table>{!displayed.length && <p className="p-8 text-center text-slate-500">Chưa có lead phù hợp. <Link href="/leads/new" className="text-blue-600">Thêm lead</Link></p>}</div></div>;
}
