"use client";
import Link from "next/link";
import { useTransition } from "react";
import { changeStage } from "../app/actions";
import { stageLabel, stages } from "../lib/lead";
type Card = { id: string; businessName: string; industry: string | null; locationText: string | null; stage: string; nextTask: string | null };
export function PipelineBoard({ leads }: { leads: Card[] }) {
  const [pending, start] = useTransition();
  function move(id: string, stage: string) { const form = new FormData(); form.set("id", id); form.set("stage", stage); start(() => { void changeStage(form); }); }
  return <div className="flex gap-4 overflow-x-auto pb-5 min-h-[480px]">{stages.map(stage => <div key={stage} onDragOver={e=>e.preventDefault()} onDrop={e=>{ e.preventDefault(); const id=e.dataTransfer.getData("text/plain"); if(id) move(id,stage); }} className="w-64 shrink-0 rounded-xl bg-slate-100 p-3"><div className="flex justify-between font-bold text-sm mb-3"><span>{stageLabel[stage]}</span><span>{leads.filter(l=>l.stage===stage).length}</span></div><div className="space-y-2">{leads.filter(l=>l.stage===stage).map(l=><div draggable onDragStart={e=>e.dataTransfer.setData("text/plain",l.id)} key={l.id} className="card p-3 cursor-grab"><Link href={`/leads/${l.id}`} className="font-semibold hover:text-blue-600">{l.businessName}</Link><div className="text-xs text-slate-500 mt-1">{l.industry || "Chưa phân ngành"} · {l.locationText || "—"}</div>{l.nextTask && <div className="text-xs mt-2 text-blue-700">↳ {l.nextTask}</div>}<select aria-label={`Chuyển trạng thái ${l.businessName}`} className="mt-3 text-xs" value={l.stage} disabled={pending} onChange={e=>move(l.id,e.target.value)}>{stages.map(s=><option key={s} value={s}>{stageLabel[s]}</option>)}</select></div>)}</div></div>)}</div>;
}
