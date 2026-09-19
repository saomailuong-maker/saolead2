import type { PriorityScoreResult, ScoreGroup } from "./types";

const bandText = { HOT: "Nên xem xét liên hệ sớm", WARM: "Có tiềm năng nhưng chưa ưu tiên cao", LOW: "Dữ liệu/cơ hội hiện chưa đủ mạnh", CLOSED: "Lead đã đóng" };
const groupLabel: Record<ScoreGroup, string> = { CONTACTABILITY: "Liên hệ", OPPORTUNITY: "Cơ hội", READINESS: "Sẵn sàng" };
const groupMax: Record<ScoreGroup, number> = { CONTACTABILITY: 25, OPPORTUNITY: 50, READINESS: 25 };

export function PriorityScoreSection({ score }: { score: PriorityScoreResult }) {
  const values: Record<ScoreGroup, number> = { CONTACTABILITY: score.contactability, OPPORTUNITY: score.opportunity, READINESS: score.readiness };
  const raw: Record<ScoreGroup, number> = { CONTACTABILITY: 0, OPPORTUNITY: 0, READINESS: 0 }; score.reasons.forEach((reason) => { raw[reason.group] += reason.points; });
  return <section className="card p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">Điểm ưu tiên</h2><p className="text-sm text-slate-500">{bandText[score.band]}</p></div><div className="text-right"><div className="text-3xl font-bold">{score.total} <span className="text-base text-slate-500">/ 100</span></div><div className="font-semibold">{score.band}</div></div></div>{score.opportunityIncomplete && <p className="mt-3 text-sm text-amber-700">Điểm cơ hội có thể chưa đầy đủ vì chưa có Website Audit thành công.</p>}<div className="mt-4 grid grid-cols-3 gap-2 text-sm">{(Object.keys(values) as ScoreGroup[]).map((group) => <div key={group} className="rounded border p-2"><div className="text-slate-500">{groupLabel[group]}</div><div className="font-semibold">{values[group]}/{groupMax[group]}</div>{raw[group] > groupMax[group] && <div className="text-xs text-slate-500">Đã giới hạn ở {groupMax[group]}</div>}</div>)}</div>{score.reasons.length > 0 && <details className="mt-4"><summary className="cursor-pointer font-medium">Vì sao có điểm này?</summary><ul className="mt-2 space-y-1 text-sm">{score.reasons.map((reason) => <li key={reason.code}>{groupLabel[reason.group]} · {reason.label} <strong>+{reason.points}</strong></li>)}</ul></details>}</section>;
}
