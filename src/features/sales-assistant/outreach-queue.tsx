"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { HOOK_TEMPLATES, getDefaultHookTemplate, type HookTemplateId } from "./hook-templates";
import { recordOutreachSent } from "./actions";

export interface QueueLead {
  id: string;
  businessName: string;
  phone: string | null;
  industry: string | null;
  locationText: string | null;
  websiteUrl: string | null;
  stage: string;
  createdAt: string;
}

export function OutreachQueue({
  initialLeads,
}: {
  initialLeads: QueueLead[];
}) {
  const [leads, setLeads] = useState<QueueLead[]>(initialLeads);
  const [selectedTemplateId, setSelectedTemplateId] = useState<HookTemplateId>("SHORT_3LINES");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [currentLeadIndex, setCurrentLeadIndex] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [cooldownDuration, setCooldownDuration] = useState<number>(60);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentLead = leads[currentLeadIndex] ?? null;

  // Sync default template when lead changes
  useEffect(() => {
    if (currentLead) {
      const def = getDefaultHookTemplate(currentLead.industry);
      setSelectedTemplateId(def);
      setEditingMessage(null);
    }
  }, [currentLead?.id, currentLead?.industry]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const activeMessage =
    editingMessage !== null
      ? editingMessage
      : currentLead
      ? HOOK_TEMPLATES[selectedTemplateId].build({
          businessName: currentLead.businessName,
          industry: currentLead.industry,
          location: currentLead.locationText,
        })
      : "";

  const handleSendZalo = (lead: QueueLead) => {
    const cleanPhone = (lead.phone || "").replace(/[^+\d]/g, "");
    if (!cleanPhone) {
      alert("Khách hàng này chưa có số điện thoại!");
      return;
    }

    const zaloUrl = `https://zalo.me/${cleanPhone}?text=${encodeURIComponent(activeMessage)}`;
    window.open(zaloUrl, "_blank");

    startTransition(async () => {
      try {
        await recordOutreachSent({
          leadId: lead.id,
          channel: "ZALO",
          summary: `Đã gửi tin nhắn mồi (Hook) qua Zalo [${HOOK_TEMPLATES[selectedTemplateId].name}]`,
        });

        // Update local state to mark contacted
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, stage: "CONTACTED" } : l))
        );

        // Start cooldown
        setCooldownRemaining(cooldownDuration);
        setStatusNotice(`✓ Đã mở Zalo & ghi nhận CRM cho "${lead.businessName}"!`);
        setTimeout(() => setStatusNotice(null), 4000);

        // Advance to next lead if available
        if (currentLeadIndex < leads.length - 1) {
          setCurrentLeadIndex((i) => i + 1);
        }
      } catch (err) {
        console.error("Failed to record outreach:", err);
      }
    });
  };

  const handleCopy = (lead: QueueLead) => {
    navigator.clipboard.writeText(activeMessage);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const pendingLeads = leads.filter((l) => l.stage === "NEW");
  const contactedLeads = leads.filter((l) => l.stage !== "NEW");

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>⚡ Hàng Đợi Gửi Tin Zalo (Outreach Queue)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gửi mồi câu ngắn gọn 1-chạm · Giãn cách an toàn chống spam · Tiết kiệm 90% thời gian mở đầu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900">
            Chờ gửi: <strong>{pendingLeads.length}</strong> khách
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
            Đã gửi: <strong>{contactedLeads.length}</strong> khách
          </div>
          <Link
            href="/discover"
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            + Quét thêm khách
          </Link>
        </div>
      </div>

      {/* Cooldown Safety Bar */}
      {cooldownRemaining > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-2">
            <span className="flex items-center gap-1.5">
              <span>⏳</span>
              <span>Đang giãn cách an toàn chống spam Zalo:</span>
              <strong className="text-sm text-amber-950 font-bold">{cooldownRemaining}s</strong>
            </span>
            <button
              type="button"
              onClick={() => setCooldownRemaining(0)}
              className="text-amber-700 hover:text-amber-950 underline font-normal"
            >
              Bỏ qua giãn cách
            </button>
          </div>
          <div className="w-full bg-amber-200/70 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-2 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(cooldownRemaining / cooldownDuration) * 100}%` }}
            />
          </div>
        </div>
      )}

      {statusNotice && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-semibold rounded-xl animate-pulse">
          {statusNotice}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <span className="text-4xl block">📭</span>
          <h2 className="text-lg font-bold text-slate-800">Chưa có khách hàng trong hàng đợi</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Hãy vào trang Tìm kiếm khách hàng để quét danh sách và bấm nút &quot;Nhập hàng loạt vào CRM&quot; để xếp hàng gửi tin ngay.
          </p>
          <Link href="/discover" className="btn inline-flex">
            🔍 Đi tìm khách hàng mới
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Main Action Stage Card */}
          <div className="card p-6 space-y-5 border-2 border-blue-200/80 shadow-md bg-gradient-to-b from-white to-slate-50/40">
            {currentLead ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Khách #{currentLeadIndex + 1} / {leads.length}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {currentLead.industry || "Chưa rõ ngành"}
                      </span>
                      {currentLead.stage === "CONTACTED" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Đã gửi Zalo
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{currentLead.businessName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {currentLead.locationText || "Chưa có địa chỉ"}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-700 tracking-wide">
                      📞 {currentLead.phone || "Chưa có SĐT"}
                    </div>
                    <Link
                      href={`/leads/${currentLead.id}`}
                      target="_blank"
                      className="text-xs text-slate-500 hover:text-blue-600 underline block mt-1"
                    >
                      Mở chi tiết Lead ↗
                    </Link>
                  </div>
                </div>

                {/* Template Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    1. Chọn kịch bản tin nhắn mồi (Hook):
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {(Object.keys(HOOK_TEMPLATES) as HookTemplateId[]).map((tid) => {
                      const t = HOOK_TEMPLATES[tid];
                      const active = selectedTemplateId === tid;
                      return (
                        <button
                          key={tid}
                          type="button"
                          onClick={() => {
                            setSelectedTemplateId(tid);
                            setEditingMessage(null);
                          }}
                          className={`text-left p-2.5 rounded-xl border text-xs transition ${
                            active
                              ? "border-blue-500 bg-blue-50/70 font-semibold text-blue-950 shadow-xs"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold">{t.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Content & Preview */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold uppercase tracking-wider">
                      2. Nội dung tin nhắn sẽ điền sẵn trên Zalo:
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingMessage(null)}
                      className="text-blue-600 hover:underline text-[11px]"
                    >
                      Đặt lại mẫu chuẩn
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={activeMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                    className="w-full text-xs font-sans p-3.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed bg-white text-slate-800"
                    placeholder="Nội dung tin nhắn..."
                  />
                </div>

                {/* Primary Outreach Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSendZalo(currentLead)}
                    disabled={isPending || !currentLead.phone}
                    className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl bg-[#0068ff] hover:bg-[#0052cc] text-white font-bold text-sm shadow-md transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    <span>
                      {isPending
                        ? "Đang ghi nhận..."
                        : cooldownRemaining > 0
                        ? `Mở Chat Zalo ngay (${cooldownRemaining}s)`
                        : "Mở Chat Zalo & Gửi khách này"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(currentLead)}
                    className="px-4 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition inline-flex items-center gap-1.5"
                  >
                    <span>{copiedId === currentLead.id ? "✓" : "📋"}</span>
                    <span>{copiedId === currentLead.id ? "Đã copy!" : "Sao chép"}</span>
                  </button>

                  {currentLead.phone && (
                    <a
                      href={`tel:${currentLead.phone.replace(/[^+\d]/g, "")}`}
                      className="px-4 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition inline-flex items-center gap-1.5"
                    >
                      <span>📞</span>
                      <span>Gọi điện</span>
                    </a>
                  )}
                </div>

                {/* Navigation Controls between leads */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <button
                    type="button"
                    disabled={currentLeadIndex === 0}
                    onClick={() => setCurrentLeadIndex((i) => Math.max(0, i - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
                  >
                    ← Khách trước
                  </button>

                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Thời gian nghỉ khuyến nghị:</span>
                    <select
                      value={cooldownDuration}
                      onChange={(e) => setCooldownDuration(Number(e.target.value))}
                      className="text-xs p-1 rounded border border-slate-300"
                    >
                      <option value="30">30 giây</option>
                      <option value="60">60 giây (Chuẩn)</option>
                      <option value="90">90 giây (An toàn)</option>
                      <option value="120">2 phút</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={currentLeadIndex >= leads.length - 1}
                    onClick={() => setCurrentLeadIndex((i) => Math.min(leads.length - 1, i + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30"
                  >
                    Khách tiếp theo →
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">Đã hết danh sách khách hàng cần gửi.</div>
            )}
          </div>

          {/* Side Queue List */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Danh sách chờ ({leads.length})
              </h3>
              <span className="text-[11px] text-slate-500">Bấm để chuyển</span>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {leads.map((lead, idx) => {
                const isActive = idx === currentLeadIndex;
                const isContacted = lead.stage === "CONTACTED";
                return (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => {
                      setCurrentLeadIndex(idx);
                      setEditingMessage(null);
                    }}
                    className={`w-full text-left p-3.5 transition flex items-center justify-between gap-2.5 ${
                      isActive
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                        <div className="font-bold text-slate-900 text-xs truncate">
                          {lead.businessName}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {lead.phone ? `📞 ${lead.phone}` : "Chưa có SĐT"} · {lead.industry || "Lưu trú"}
                      </div>
                    </div>

                    <div>
                      {isContacted ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Đã gửi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                          Chờ
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
