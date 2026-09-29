"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { HOOK_TEMPLATES, getDefaultHookTemplate, type HookTemplateId } from "./hook-templates";
import { recordOutreachSent, updateLeadPhone } from "./actions";
import { classifyPhoneNumber, type PhoneClassification } from "../../lib/phone";

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
  const [phoneFilter, setPhoneFilter] = useState<"ALL" | "MOBILE" | "LANDLINE">("ALL");
  const [selectedTemplateId, setSelectedTemplateId] = useState<HookTemplateId>("SHORT_3LINES");
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [currentLeadIndex, setCurrentLeadIndex] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [cooldownDuration, setCooldownDuration] = useState<number>(60);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [quickPhoneInput, setQuickPhoneInput] = useState("");
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter leads based on phone classification
  const mobileCount = leads.filter((l) => classifyPhoneNumber(l.phone).type === "MOBILE").length;
  const landlineCount = leads.filter((l) => classifyPhoneNumber(l.phone).type === "LANDLINE").length;

  const visibleLeads = leads.filter((l) => {
    const info = classifyPhoneNumber(l.phone);
    if (phoneFilter === "MOBILE") return info.type === "MOBILE";
    if (phoneFilter === "LANDLINE") return info.type === "LANDLINE";
    return true;
  });

  const safeIndex = Math.min(currentLeadIndex, Math.max(0, visibleLeads.length - 1));
  const currentLead = visibleLeads[safeIndex] ?? null;
  const phoneInfo: PhoneClassification = classifyPhoneNumber(currentLead?.phone);

  // Sync default template when lead changes
  const [prevLeadId, setPrevLeadId] = useState(currentLead?.id);
  if (currentLead && currentLead.id !== prevLeadId) {
    setPrevLeadId(currentLead.id);
    setSelectedTemplateId(getDefaultHookTemplate(currentLead.industry));
    setEditingMessage(null);
    setQuickPhoneInput("");
    setCopiedScript(false);
  }

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
    const info = classifyPhoneNumber(lead.phone);
    if (!info.isZaloSupported) {
      alert(`Số điện thoại ${lead.phone} là ${info.label}, không hỗ trợ Zalo cá nhân. Hãy dùng nút Gọi Lễ Tân bên dưới để xin số Zalo của quản lý.`);
      return;
    }

    const zaloUrl = `https://zalo.me/${info.normalized}?text=${encodeURIComponent(activeMessage)}`;
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
        if (safeIndex < visibleLeads.length - 1) {
          setCurrentLeadIndex((i) => i + 1);
        }
      } catch (err) {
        console.error("Failed to record outreach:", err);
      }
    });
  };

  const handleRecordCall = (lead: QueueLead) => {
    startTransition(async () => {
      try {
        await recordOutreachSent({
          leadId: lead.id,
          channel: "CALL",
          summary: `Đã gọi điện thoại ${lead.phone} (${phoneInfo.label})`,
        });
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, stage: "CONTACTED" } : l))
        );
        setStatusNotice(`✓ Đã ghi nhận cuộc gọi cho "${lead.businessName}"!`);
        setTimeout(() => setStatusNotice(null), 4000);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleSavePhoneAndZalo = async (lead: QueueLead) => {
    const info = classifyPhoneNumber(quickPhoneInput);
    if (!info.isZaloSupported) {
      alert("Vui lòng nhập số điện thoại di động 10 số (03x, 05x, 07x, 08x, 09x) để mở Zalo.");
      return;
    }

    try {
      await updateLeadPhone({ leadId: lead.id, phone: info.normalized });
      const updatedLead = { ...lead, phone: info.normalized };
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));
      setStatusNotice(`✓ Đã cập nhật số Zalo mới (${info.normalized}) cho "${lead.businessName}"!`);
      // Trigger sending Zalo immediately
      handleSendZalo(updatedLead);
    } catch (err) {
      console.error(err);
      alert("Không thể lưu số điện thoại. Vui lòng thử lại.");
    }
  };

  const handleCopy = (lead: QueueLead) => {
    navigator.clipboard.writeText(activeMessage);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCopyReceptionistScript = () => {
    if (phoneInfo.receptionistScript) {
      navigator.clipboard.writeText(phoneInfo.receptionistScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    }
  };

  const pendingCount = visibleLeads.filter((l) => l.stage === "NEW").length;
  const contactedCount = visibleLeads.filter((l) => l.stage !== "NEW").length;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>⚡ Hàng Đợi Gửi Tin Zalo (Outreach Queue)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gửi kịch bản mở đầu 1-chạm · Phân loại SĐT thông minh · Giãn cách an toàn chống spam Zalo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900">
            Chờ xử lý: <strong>{pendingCount}</strong> khách
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900">
            Đã tiếp cận: <strong>{contactedCount}</strong> khách
          </div>
          <Link
            href="/discover"
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            + Quét thêm khách
          </Link>
        </div>
      </div>

      {/* Filter Tabs by Phone Type */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Bộ lọc SĐT:</span>
          <button
            type="button"
            onClick={() => {
              setPhoneFilter("ALL");
              setCurrentLeadIndex(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              phoneFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tất cả ({leads.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoneFilter("MOBILE");
              setCurrentLeadIndex(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              phoneFilter === "MOBILE"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <span>📱 Di động (Zalo sẵn sàng)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">{mobileCount}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPhoneFilter("LANDLINE");
              setCurrentLeadIndex(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              phoneFilter === "LANDLINE"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span>☎️ Máy bàn (Gọi lễ tân)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">{landlineCount}</span>
          </button>
        </div>

        {statusNotice && (
          <div className="text-xs font-bold text-emerald-700 animate-pulse px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
            {statusNotice}
          </div>
        )}
      </div>

      {visibleLeads.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <p className="text-base font-semibold text-slate-700">Không có khách hàng nào phù hợp bộ lọc này.</p>
          <p className="text-xs text-slate-500 mt-1">Hãy chuyển sang tab khác hoặc nhập thêm lead từ phần Khám phá.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Action Work Area (2 cols) */}
          <div className="lg:col-span-2 space-y-4 card p-6 border-2 border-blue-500/20 shadow-md">
            {currentLead ? (
              <>
                {/* Lead Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Khách #{safeIndex + 1} / {visibleLeads.length}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {currentLead.industry || "Chưa rõ ngành"}
                      </span>
                      {phoneInfo.type === "MOBILE" && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          📱 Di động · Zalo
                        </span>
                      )}
                      {phoneInfo.type === "LANDLINE" && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          ☎️ {phoneInfo.label}
                        </span>
                      )}
                      {currentLead.stage === "CONTACTED" && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Đã tiếp cận
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{currentLead.businessName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {currentLead.locationText || "Chưa có địa chỉ"}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className={`text-lg font-bold tracking-wide ${phoneInfo.type === "LANDLINE" ? "text-amber-800" : "text-blue-700"}`}>
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

                {/* Landline Notice & Telesale Script Helper */}
                {phoneInfo.type === "LANDLINE" && (
                  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl">☎️</span>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          Số máy bàn cố định ({phoneInfo.provinceName}) · Zalo không hỗ trợ mở chat trực tiếp
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Số bàn này thường là quầy lễ tân. Hãy bấm <strong>Gọi lễ tân</strong> và dùng kịch bản ngắn dưới đây để xin số Zalo cá nhân của Quản lý / Chủ khách sạn:
                        </p>
                      </div>
                    </div>

                    {/* Receptionist Script Box */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs text-slate-800 italic leading-relaxed relative">
                      &quot;{phoneInfo.receptionistScript}&quot;
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={`tel:${phoneInfo.normalized}`}
                        onClick={() => handleRecordCall(currentLead)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
                      >
                        <span>📞</span>
                        <span>Gọi Lễ tân ({currentLead.phone})</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyReceptionistScript}
                        className="px-3.5 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition"
                      >
                        <span>{copiedScript ? "✓" : "📋"}</span>
                        <span>{copiedScript ? "Đã copy kịch bản!" : "Copy kịch bản gọi"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRecordCall(currentLead)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                      >
                        Ghi nhận đã gọi
                      </button>
                    </div>

                    {/* Quick Phone Update Box */}
                    <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-amber-950">Đã xin được số Zalo Quản lý:</span>
                      <input
                        type="text"
                        value={quickPhoneInput}
                        onChange={(e) => setQuickPhoneInput(e.target.value)}
                        placeholder="Nhập SĐT di động (VD: 0912345678)"
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-xs w-56 focus:outline-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePhoneAndZalo(currentLead)}
                        disabled={!quickPhoneInput.trim()}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        Lưu & Mở Zalo ngay 🚀
                      </button>
                    </div>
                  </div>
                )}

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
                    disabled={isPending || !currentLead.phone || phoneInfo.type === "LANDLINE"}
                    className={`flex-1 min-w-[200px] py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                      phoneInfo.type === "LANDLINE"
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-[#0068ff] hover:bg-[#0052cc] text-white"
                    }`}
                  >
                    <span>💬</span>
                    <span>
                      {isPending
                        ? "Đang ghi nhận..."
                        : cooldownRemaining > 0
                        ? `Mở Chat Zalo ngay (${cooldownRemaining}s)`
                        : phoneInfo.type === "LANDLINE"
                        ? "Zalo không hỗ trợ số máy bàn"
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
                      href={`tel:${phoneInfo.normalized}`}
                      onClick={() => handleRecordCall(currentLead)}
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
                    disabled={safeIndex === 0}
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
                    disabled={safeIndex >= visibleLeads.length - 1}
                    onClick={() => setCurrentLeadIndex((i) => Math.min(visibleLeads.length - 1, i + 1))}
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
                Danh sách chờ ({visibleLeads.length})
              </h3>
              <span className="text-[11px] text-slate-500">Bấm để chọn</span>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {visibleLeads.map((lead, idx) => {
                const isActive = idx === safeIndex;
                const isContacted = lead.stage === "CONTACTED";
                const info = classifyPhoneNumber(lead.phone);
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
                      <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <span>{info.type === "LANDLINE" ? "☎️" : "📱"}</span>
                        <span>{lead.phone || "Chưa có SĐT"}</span>
                        <span>·</span>
                        <span>{lead.industry || "Lưu trú"}</span>
                      </div>
                    </div>

                    <div>
                      {isContacted ? (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
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
