"use client";

import { useState, useTransition } from "react";
import { recordOutreachSent } from "./actions";
import { detectLodgingSegment } from "../public-audit/presentation";

export function OutreachActionBar({
  lead,
  publicReportToken,
  demoSlug,
}: {
  lead: {
    id: string;
    businessName: string;
    phone: string | null;
    facebookUrl: string | null;
    industry: string | null;
    locationText: string | null;
    stage: string;
  };
  publicReportToken?: string | null;
  demoSlug?: string | null;
}) {
  const [style, setStyle] = useState<"NATURAL" | "VALUE" | "DEMO">("NATURAL");
  const [copied, setCopied] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
  const reportUrl = publicReportToken ? `${baseUrl}/r/${publicReportToken}` : "";
  const demoUrl = demoSlug ? `${baseUrl}/demo/${demoSlug}` : "";

  const cleanPhone = (lead.phone || "").replace(/[^+\d]/g, "");

  const buildMessage = () => {
    const isLodging = /hotel|homestay|khách sạn|nhà nghỉ|resort|lưu trú/i.test(lead.industry || "");
    const lodgingSegment = isLodging ? detectLodgingSegment(lead.businessName, lead.industry || "") : null;

    if (style === "NATURAL") {
      return `Em chào anh/chị, em có xem qua kênh online của ${lead.businessName} trên Google Maps thấy bên mình làm hình ảnh và đánh giá rất tốt.
Em có chuẩn bị 1 bản thẩm định nhanh về cơ hội tiếp cận khách du lịch và chốt khách trực tiếp cho ${lead.businessName}${reportUrl ? `: ${reportUrl}` : ""}${demoUrl ? ` (Kèm bản thử giao diện: ${demoUrl})` : ""}.
Anh/chị xem qua xem có hữu ích cho mình không nhé!`;
    }

    if (style === "VALUE") {
      if (lodgingSegment === "HOMESTAY") {
        return `Chào anh/chị ${lead.businessName}, em thấy bên mình làm homestay rất có gu và khách đánh giá cao. Tuy nhiên việc mỗi ngày phải trả lời lặp đi lặp lại hàng chục tin nhắn trong inbox Facebook/Zalo rồi khách 'seen không rep' hoặc khách tìm thấy trên Google Maps mà không thấy bảng giá ngay thì khá phí.
Em có gửi anh/chị bản phân tích giải pháp trang đích bio xem ảnh phòng 360° & cọc Zalo 1-chạm${reportUrl ? `: ${reportUrl}` : ""}${demoUrl ? ` · Bản xem thử: ${demoUrl}` : ""}.
Anh/chị xem qua để tối ưu thời gian trực chat nhé!`;
      }

      if (lodgingSegment === "HOTEL") {
        return `Chào anh/chị ${lead.businessName}, em thấy khách sạn mình đang đón khách trên Google Maps rất đều. Tuy nhiên việc chi trả 15% – 22% phí hoa hồng cho các sàn OTA (Booking/Agoda) mỗi tháng làm hao hụt đáng kể lợi nhuận từ tệp khách hàng quen thuộc.
Em có gửi anh/chị bản phân tích giải pháp Direct Booking trực tiếp giúp giữ trọn 100% doanh thu và hỗ trợ xuất hóa đơn VAT${reportUrl ? `: ${reportUrl}` : ""}${demoUrl ? ` · Bản thử demo: ${demoUrl}` : ""}.
Nếu tiện mình cùng trao đổi nhé!`;
      }

      if (lodgingSegment === "VILLA") {
        return `Chào anh/chị ${lead.businessName}, em thấy căn villa của mình rất đẹp và phù hợp cho khách đoàn nghỉ dưỡng. Tuy nhiên các deal villa giá trị cao thì người đại diện đoàn thường khó chốt vì gửi thông tin phòng và tiện ích BBQ qua tin nhắn bị rời rạc, các thành viên khác dễ bàn lùi.
Em có gửi anh/chị bản phân tích giải pháp gửi 1 link tổng thể để cả đoàn cùng xem và chốt cọc trong 15 phút${reportUrl ? `: ${reportUrl}` : ""}${demoUrl ? ` · Bản thử demo: ${demoUrl}` : ""}.
Anh/chị xem qua nhé!`;
      }

      return isLodging
        ? `Chào anh/chị ${lead.businessName}, em thấy bên mình đang có lượng khách tìm hiểu trên Maps rất đều.
Em có gửi anh/chị bản phân tích giải pháp đặt phòng 1 chạm trực tiếp${reportUrl ? `: ${reportUrl}` : ""}${demoUrl ? ` · Bản thử: ${demoUrl}` : ""}.
Nếu thấy tiện mình cùng trao đổi nhé!`
        : `Chào anh/chị, em gửi anh/chị bản phân tích cơ hội tối ưu hiện diện số và tiếp cận khách hàng địa phương cho ${lead.businessName}${reportUrl ? `: ${reportUrl}` : ""}${demoUrl ? ` · Bản thử demo: ${demoUrl}` : ""}.
Anh/chị xem qua để nắm các điểm có thể tối ưu chuyển đổi ngay nhé!`;
    }

    return `Em chào anh/chị, bên em vừa dựng thử 1 bản demo giao diện xem thông tin & liên hệ 1 chạm cho ${lead.businessName}${demoUrl ? `: ${demoUrl}` : ""}${reportUrl ? ` (Kèm báo cáo: ${reportUrl})` : ""}.
Anh/chị mở trên điện thoại xem thử trải nghiệm thực tế nhé, nếu hướng này phù hợp em sẽ hỗ trợ cập nhật thêm!`;
  };

  const message = buildMessage();

  const handleAction = async (channel: "ZALO" | "FACEBOOK" | "CALL" | "COPY_LINK") => {
    startTransition(async () => {
      try {
        await recordOutreachSent({
          leadId: lead.id,
          channel,
          summary: `Đã gửi tin nhắn mở đầu qua ${channel} (${style === "NATURAL" ? "Tự nhiên" : style === "VALUE" ? "Giá trị" : "Mời xem demo"})${reportUrl ? " kèm Báo cáo" : ""}${demoUrl ? " kèm Demo" : ""}`,
        });
        setStatusNotice(`Đã ghi nhận gửi qua ${channel} & cập nhật CRM!`);
        setTimeout(() => setStatusNotice(null), 4000);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    handleAction("COPY_LINK");
  };

  const handleZalo = () => {
    if (!cleanPhone) {
      alert("Lead này chưa có số điện thoại. Vui lòng cập nhật số điện thoại trước.");
      return;
    }
    const zaloUrl = `https://zalo.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(zaloUrl, "_blank");
    handleAction("ZALO");
  };

  const handleMessenger = () => {
    if (!lead.facebookUrl) {
      alert("Lead này chưa có liên kết Facebook.");
      return;
    }
    window.open(lead.facebookUrl, "_blank");
    handleAction("FACEBOOK");
  };

  return (
    <section className="rounded-2xl border-2 border-[#da8d50]/30 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#da8d50] text-sm font-bold text-white shadow-sm">
            ⚡
          </span>
          <div>
            <h2 className="font-bold text-[#17324d] text-base">Công cụ Gửi Bán Tự Động 1-Click</h2>
            <p className="text-xs text-slate-500">Mở ứng dụng gửi ngay · Tự động ghi nhận Activity &amp; cập nhật Stage</p>
          </div>
        </div>

        {/* Style Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setStyle("NATURAL")}
            className={`rounded-lg px-3 py-1 font-semibold transition ${style === "NATURAL" ? "bg-[#17324d] text-white" : "text-slate-600 hover:text-black"}`}
          >
            Tự nhiên
          </button>
          <button
            type="button"
            onClick={() => setStyle("VALUE")}
            className={`rounded-lg px-3 py-1 font-semibold transition ${style === "VALUE" ? "bg-[#17324d] text-white" : "text-slate-600 hover:text-black"}`}
          >
            Giá trị &amp; ROI
          </button>
          <button
            type="button"
            onClick={() => setStyle("DEMO")}
            className={`rounded-lg px-3 py-1 font-semibold transition ${style === "DEMO" ? "bg-[#17324d] text-white" : "text-slate-600 hover:text-black"}`}
          >
            Mời xem Demo
          </button>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="mt-4 flex flex-wrap gap-2.5 items-center">
        <button
          type="button"
          onClick={handleZalo}
          disabled={isPending}
          className="rounded-xl bg-[#0068ff] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#0052cc] inline-flex items-center gap-2"
        >
          <span>💬</span> Nhắn Zalo 1-Click
        </button>

        {lead.facebookUrl && (
          <button
            type="button"
            onClick={handleMessenger}
            disabled={isPending}
            className="rounded-xl bg-[#0084ff] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#0070db] inline-flex items-center gap-1.5"
          >
            <span>🔵</span> Messenger
          </button>
        )}

        <button
          type="button"
          onClick={handleCopy}
          disabled={isPending}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <span>{copied ? "✓" : "📋"}</span> {copied ? "Đã sao chép!" : "Sao chép tin nhắn kèm Link"}
        </button>

        {cleanPhone && (
          <a
            href={`tel:${cleanPhone}`}
            onClick={() => handleAction("CALL")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <span>📞</span> Gọi hotline
          </a>
        )}

        {statusNotice && <span className="text-xs font-bold text-emerald-700 animate-pulse">{statusNotice}</span>}
      </div>

      {/* Message Preview Box */}
      <div className="mt-3 rounded-xl bg-white/90 p-3.5 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
        {message}
      </div>

      {/* Quick Access Badges & Links */}
      <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 border-t border-amber-200/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">1. Báo cáo Thẩm Định:</span>
          {reportUrl ? (
            <a
              href={reportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800 hover:bg-emerald-200 transition"
            >
              <span>📊 Mở Báo Cáo Thẩm Định Số</span>
              <span className="text-[10px] text-emerald-600">↗</span>
            </a>
          ) : (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-500 font-medium">
              Chưa tạo (Tạo tại mục &quot;Báo cáo gửi khách&quot; bên dưới)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">2. Bản Demo Tương Tác:</span>
          {demoUrl ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-100 px-2.5 py-1 font-bold text-indigo-800 hover:bg-indigo-200 transition"
            >
              <span>📱 Mở Demo Giả Lập iPhone 16</span>
              <span className="text-[10px] text-indigo-600">↗</span>
            </a>
          ) : (
            <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-amber-800 font-medium">
              Chưa tạo demo (Bấm nút &quot;Tạo demo&quot; ở mục &quot;Demo đề xuất&quot; bên dưới)
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
