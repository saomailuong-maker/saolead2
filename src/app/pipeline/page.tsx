import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { PipelineBoard } from "../../components/pipeline-board";
export default async function Pipeline() { const { workspaceId } = await requireActor(); const leads = await db.lead.findMany({ where: { workspaceId, archivedAt: null }, orderBy: { updatedAt: "desc" }, include: { tasks: { where: { status: "OPEN" }, orderBy: { dueAt: "asc" }, take: 1 } } }); return <div><h1 className="text-3xl font-bold">Pipeline</h1><p className="text-slate-500 mt-1 mb-6">Kéo thả thẻ hoặc chọn trạng thái để cập nhật.</p><PipelineBoard leads={leads.map(l=>({ id:l.id,businessName:l.businessName,industry:l.industry,locationText:l.locationText,stage:l.stage,nextTask:l.tasks[0]?.title ?? null }))}/></div>; }
