"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { addToInbox, bulkImportToCrm, searchBusinesses, type PlaceDiscoveryStatus, type SearchState } from "./actions";
import { diagnosticsMessage, preferredQuota } from "./diagnostics";
import { industries, locations } from "./query";
import type { EnrichedSearchResult } from "./seen-places";

function renderStatusBadge(status?: PlaceDiscoveryStatus, seenCount?: number) {
  switch (status) {
    case "CRM":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          Đã có CRM
        </span>
      );
    case "INBOX":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          Đang ở Inbox
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200 line-through">
          Đã loại
        </span>
      );
    case "SEEN_BEFORE":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Đã xem ({seenCount ?? 2})
        </span>
      );
    case "NEW":
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Mới
        </span>
      );
  }
}

export function SearchForm({ initialState = { results: [] } }: { initialState?: SearchState }) {
  const [state, action, pending] = useActionState(searchBusinesses, initialState);
  const [inspectingPlace, setInspectingPlace] = useState<EnrichedSearchResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const [bulkResult, setBulkResult] = useState<{ imported: number; skipped: number } | null>(null);
  const quota = preferredQuota(state.diagnostics?.quota ?? null);

  useEffect(() => {
    if (state.sessionId) {
      window.history.replaceState(null, "", `/discover?session=${encodeURIComponent(state.sessionId)}`);
    }
  }, [state.sessionId]);

  const [prevSessionId, setPrevSessionId] = useState(state.sessionId);
  if (state.sessionId !== prevSessionId) {
    setPrevSessionId(state.sessionId);
    setSelectedIds(new Set());
    setBulkResult(null);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === state.results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(state.results.map((r) => r.externalId)));
    }
  };

  const selectOnlyNew = () => {
    const newPlaceIds = state.results
      .filter((r) => r.discoveryStatus !== "CRM" && r.discoveryStatus !== "REJECTED")
      .map((r) => r.externalId);
    setSelectedIds(new Set(newPlaceIds));
  };

  const handleBulkImport = () => {
    if (!state.sessionId || selectedIds.size === 0) return;
    startBulkTransition(async () => {
      const res = await bulkImportToCrm({
        sessionId: state.sessionId!,
        externalIds: Array.from(selectedIds),
      });
      if (res.success) {
        setBulkResult({ imported: res.importedCount, skipped: res.skippedCount });
        setSelectedIds(new Set());
      }
    });
  };

  return (
    <div className="space-y-5">
      <form action={action} className="card p-5 space-y-4">
        <div className="grid md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_160px] gap-3 items-end">
          <div>
            <label className="label" htmlFor="location">
              Khu vực
            </label>
            <select id="location" name="location" defaultValue={initialState.location || "Đà Lạt"}>
              {locations.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="industry">
              Ngành
            </label>
            <select id="industry" name="industry" defaultValue={initialState.industry || "Homestay"}>
              {industries.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="keyword">
              Từ khóa bổ sung
            </label>
            <input id="keyword" name="keyword" maxLength={80} placeholder="Không bắt buộc" />
          </div>
          <div>
            <label className="label" htmlFor="maxResults">
              Số kết quả tối đa
            </label>
            <select id="maxResults" name="maxResults" defaultValue="20">
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Chế độ <strong className="text-slate-700">&quot;Tìm thêm khách mới&quot;</strong> tự động loại bỏ doanh nghiệp đã thấy (tối đa 3 requests/lần).
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              name="actionType"
              value="standard"
              disabled={pending}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              {pending ? "Đang tìm..." : "Tìm khách hàng"}
            </button>
            <button
              type="submit"
              name="actionType"
              value="find_new"
              disabled={pending}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>✨</span>
              <span>{pending ? "Đang tìm khách mới..." : "Tìm thêm khách mới"}</span>
            </button>
          </div>
        </div>
      </form>

      {state.searchStats && (
        <div className="card p-4 bg-emerald-50/80 border-emerald-200 text-emerald-900 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎯</span>
            <div>
              <div className="font-semibold text-emerald-950">
                Tìm thấy {state.searchStats.newFound} doanh nghiệp MỚI
              </div>
              <div className="text-xs text-emerald-800 mt-0.5">
                Đã quét tổng cộng {state.searchStats.totalReturned} địa điểm
                {state.searchStats.skippedSeen > 0 && ` · Đã lọc bỏ ${state.searchStats.skippedSeen} địa điểm cũ đã từng thấy`}.
              </div>
            </div>
          </div>
          <div className="text-xs font-medium px-2.5 py-1 rounded bg-white/80 border border-emerald-200 text-emerald-800">
            Đã dùng: {state.searchStats.requestsUsed} / 3 requests
          </div>
        </div>
      )}

      {state.error === "provider" && state.diagnostics && (
        <div role="alert" className="card p-4 text-red-700">
          {diagnosticsMessage(state.diagnostics)}
        </div>
      )}
      {state.error === "input" && (
        <div role="alert" className="card p-4 text-red-700">
          Thông tin tìm kiếm không hợp lệ.
        </div>
      )}

      {state.diagnostics && (
        <section className="card p-4 text-sm" aria-label="Trạng thái Places provider">
          <h2 className="font-bold">Trạng thái Places</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-slate-500">Transport</dt>
              <dd>{state.diagnostics.transport}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Request gần nhất</dt>
              <dd>{state.diagnostics.status === "SUCCESS" ? "Thành công" : "Lỗi"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">HTTP status</dt>
              <dd>{state.diagnostics.httpStatus ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Quota còn lại / reset</dt>
              <dd>
                {quota ? `${quota.remaining ?? "—"} / ${quota.reset ?? "—"}` : "Không có dữ liệu quota từ provider."}
              </dd>
            </div>
          </dl>
          {state.diagnostics.status === "ERROR" && (
            <details className="mt-3">
              <summary className="cursor-pointer text-blue-600">Chi tiết kỹ thuật an toàn</summary>
              <p className="mt-2 text-slate-600">
                Loại: {state.diagnostics.errorKind ?? "—"} · Mã provider: {state.diagnostics.providerCode ?? "—"}
              </p>
              {state.diagnostics.providerMessage && <p className="mt-1 text-slate-600">{state.diagnostics.providerMessage}</p>}
            </details>
          )}
        </section>
      )}

      {state.sessionId && (
        <section className="card overflow-x-auto">
          {bulkResult && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-sm text-emerald-950">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <span>
                  Đã nhập thành công <strong>{bulkResult.imported}</strong> cơ sở vào CRM!
                  {bulkResult.skipped > 0 && ` (Đã bỏ qua ${bulkResult.skipped} cơ sở đã tồn tại)`}
                </span>
              </div>
              <Link
                href="/outreach"
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-xs text-xs inline-flex items-center gap-1.5 transition"
              >
                <span>💬</span>
                <span>Mở Hàng Đợi Gửi Zalo Ngay →</span>
              </Link>
            </div>
          )}

          <div className="p-4 flex justify-between items-center border-b border-slate-100">
            <h2 className="font-bold">
              Kết quả ({state.results.length})
              {state.mode === "FIND_NEW" && (
                <span className="ml-2 text-xs font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Chế độ khách mới
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5e5e5e]" translate="no">
                Google Maps
              </span>
            </div>
          </div>

          {state.results.length > 0 && (
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Đã chọn: <strong className="text-blue-700 font-bold">{selectedIds.size}</strong> / {state.results.length}
                </span>
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 transition"
                >
                  {selectedIds.size === state.results.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
                <button
                  type="button"
                  onClick={selectOnlyNew}
                  className="px-2 py-1 bg-white border border-emerald-300 text-emerald-800 font-medium rounded hover:bg-emerald-50 transition"
                >
                  Chỉ chọn cơ sở mới
                </button>
              </div>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={isBulkPending}
                  className="px-3.5 py-1.5 bg-[#17324d] text-white font-semibold rounded-lg shadow-sm hover:bg-[#102438] transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>{isBulkPending ? "Đang nhập CRM..." : `Nhập ${selectedIds.size} cơ sở đã chọn vào CRM`}</span>
                </button>
              )}
            </div>
          )}

          {state.results.length ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả"
                      checked={state.results.length > 0 && selectedIds.size === state.results.length}
                      onChange={selectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  {["Tên doanh nghiệp", "Trạng thái", "Địa chỉ", "Loại hình", "Website", "Nguồn", "Thao tác"].map(
                    (t) => (
                      <th className="p-3 font-semibold" key={t}>
                        {t}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {state.results.map((result) => (
                  <tr
                    key={result.externalId}
                    className={`hover:bg-slate-50/50 transition ${selectedIds.has(result.externalId) ? "bg-blue-50/40" : ""}`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${result.name}`}
                        checked={selectedIds.has(result.externalId)}
                        onChange={() => toggleSelect(result.externalId)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{result.name}</div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {renderStatusBadge(result.discoveryStatus, result.seenCount)}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[240px] truncate">
                      {result.address || "—"}
                    </td>
                    <td className="p-3 text-slate-600">{result.type || "—"}</td>
                    <td className="p-3 text-slate-400">Chưa kiểm tra</td>
                    <td className="p-3 text-slate-500">Google Maps</td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectingPlace(result)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline mb-1.5 transition"
                      >
                        <span>🔍</span>
                        <span>Xem chi tiết</span>
                      </button>

                      {result.discoveryStatus === "CRM" ? (
                        <span className="text-purple-700 font-medium text-xs block">Đã có trong CRM</span>
                      ) : result.discoveryStatus === "INBOX" || result.inInbox ? (
                        <span className="text-slate-500 text-xs block">Đã có trong Lead Inbox</span>
                      ) : result.discoveryStatus === "REJECTED" ? (
                        <span className="text-slate-400 text-xs block line-through">Đã loại bỏ</span>
                      ) : (
                        <form action={addToInbox}>
                          <input type="hidden" name="sessionId" value={state.sessionId} />
                          <input type="hidden" name="externalId" value={result.externalId} />
                          <button type="submit" className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs block">
                            + Đưa vào Lead Inbox
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-slate-500">
              Không tìm thấy doanh nghiệp phù hợp. Thử đổi ngành hoặc khu vực.
            </p>
          )}
        </section>
      )}

      {/* Quick View & Funnel Qualification Modal */}
      {inspectingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    {inspectingPlace.type || "Địa điểm kinh doanh"}
                  </span>
                  {renderStatusBadge(inspectingPlace.discoveryStatus, inspectingPlace.seenCount)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{inspectingPlace.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPlace(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 text-lg leading-none transition"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dữ liệu quét sơ bộ (Google Maps)
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-sm space-y-2.5">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 shrink-0 mt-0.5">📍</span>
                    <span className="text-slate-800 font-medium">
                      {inspectingPlace.address || "Chưa có địa chỉ chi tiết trong kết quả tìm kiếm"}
                    </span>
                  </div>

                  {inspectingPlace.location && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pl-6">
                      <span>Tọa độ: {inspectingPlace.location.latitude.toFixed(5)}, {inspectingPlace.location.longitude.toFixed(5)}</span>
                      {inspectingPlace.locationQuality?.distanceKm != null && (
                        <span className="text-slate-600 font-medium bg-slate-200/70 px-2 py-0.5 rounded">
                          Khoảng cách: ~{inspectingPlace.locationQuality.distanceKm.toFixed(1)} km từ trung tâm
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-400">Place ID: {inspectingPlace.externalId}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${inspectingPlace.name} ${inspectingPlace.address || ""}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span>Mở xem trên Google Maps</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Two-Stage Funnel & Qualification Guide */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2.5">
                <div className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                  <span>💡</span>
                  <span>Quy trình 2 bước: Tìm kiếm sơ bộ → Khai thác chuyên sâu (Lead Inbox)</span>
                </div>
                <p className="text-amber-900 leading-relaxed">
                  Ở danh sách tìm kiếm, hệ thống chỉ lưu thông tin nhận diện cơ bản để tối ưu tốc độ quét hàng loạt.
                </p>
                <div className="p-3 bg-white/90 rounded-lg border border-amber-200/80 text-slate-700 space-y-1.5">
                  <div className="font-bold text-slate-900">Khi bạn nhấn &quot;+ Đưa vào Lead Inbox&quot;:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Hệ thống tự động gọi API chuyên sâu (Place Details Enrichment).</li>
                    <li>Tự động bóc tách: <strong>Số điện thoại / Hotline</strong>, <strong>Website</strong>, <strong>Số sao Google</strong>, <strong>Số lượt đánh giá</strong>, <strong>Giờ mở cửa</strong>.</li>
                    <li>Chuyển vào hộp thư Lead Inbox để bạn kiểm tra (Qualify) trước khi đẩy vào CRM để tạo Bản Thẩm định &amp; Demo!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setInspectingPlace(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition"
              >
                Đóng lại
              </button>

              {inspectingPlace.discoveryStatus === "CRM" ? (
                <span className="text-purple-800 font-bold text-xs px-3.5 py-2 bg-purple-100 border border-purple-200 rounded-lg">
                  ✓ Doanh nghiệp đã được đưa vào CRM
                </span>
              ) : inspectingPlace.discoveryStatus === "INBOX" || inspectingPlace.inInbox ? (
                <span className="text-blue-800 font-bold text-xs px-3.5 py-2 bg-blue-100 border border-blue-200 rounded-lg">
                  ✓ Đã có trong Lead Inbox
                </span>
              ) : inspectingPlace.discoveryStatus === "REJECTED" ? (
                <span className="text-slate-500 font-medium text-xs px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg line-through">
                  Đã loại bỏ khỏi danh sách
                </span>
              ) : (
                <form action={addToInbox}>
                  <input type="hidden" name="sessionId" value={state.sessionId} />
                  <input type="hidden" name="externalId" value={inspectingPlace.externalId} />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition"
                  >
                    <span>+</span>
                    <span>Đưa vào Lead Inbox &amp; Khai thác chi tiết</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
