import Link from "next/link";
import type { SearchHistoryItem } from "./actions";

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function SearchHistory({
  sessions,
  currentSessionId,
}: {
  sessions: SearchHistoryItem[];
  currentSessionId?: string;
}) {
  if (sessions.length === 0) return null;

  return (
    <section className="card p-4 text-sm" aria-label="Lịch sử tìm kiếm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <span>🕒</span>
          <span>Lịch sử tìm kiếm gần đây</span>
        </h2>
        <span className="text-xs text-slate-500">Xem lại không tốn quota API</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {sessions.map((s) => {
          const isCurrent = s.id === currentSessionId;
          const isFindNew = s.mode === "FIND_NEW";

          return (
            <div
              key={s.id}
              className={`flex-shrink-0 min-w-[210px] rounded-lg border p-3 transition-colors ${
                isCurrent
                  ? "border-blue-500 bg-blue-50/50 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="font-semibold text-slate-900 truncate">
                  {s.location} · {s.industry}
                </div>
                {isFindNew && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                    Khách mới
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  {s.searchStats
                    ? `${s.searchStats.newFound} mới / ${s.searchStats.totalReturned} kq`
                    : `${s.resultCount} kết quả`}
                </span>
                <span>{formatTime(s.createdAt)}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isCurrent ? "Đang xem" : "Đã lưu trong DB"}
                </span>
                <Link
                  href={`/discover?session=${s.id}`}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                    isCurrent
                      ? "text-blue-700 bg-blue-100 cursor-default pointer-events-none"
                      : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {isCurrent ? "Đang mở" : "Xem lại"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
