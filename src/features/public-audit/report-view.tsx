"use client";

import Image from "next/image";
import { useState } from "react";
import type { PublicAuditSnapshot } from "./types";
import type { ReportNarrative } from "./presentation";

const eyebrow = "text-xs font-bold uppercase tracking-[0.2em] text-[#a65f35]";

export function PublicAuditReportView({
  token,
  report,
  narrative: n,
  demoSlug,
  conceptImagePath,
}: {
  token: string;
  report: PublicAuditSnapshot;
  narrative: ReportNarrative;
  demoSlug?: string | null;
  conceptImagePath?: string | null;
}) {
  const [viewMode, setViewMode] = useState<"QUICK" | "FULL">("QUICK");

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "EXCELLENT":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "GOOD":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "NEEDS_IMPROVEMENT":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-rose-100 text-rose-800 border-rose-300";
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-12">
      {/* Top View Mode Switcher Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-md border border-slate-200">
        <div className="flex items-center gap-2 pl-2">
          <span className="text-lg">🎯</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Chế độ xem báo cáo:
          </span>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode("QUICK")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition shadow-xs ${
              viewMode === "QUICK"
                ? "bg-[#17324d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>⚡</span>
            <span>Bản Tóm Tắt Nhanh (60 giây)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("FULL")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
              viewMode === "FULL"
                ? "bg-[#17324d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📋</span>
            <span>Báo cáo Chuyên sâu (Đầy đủ)</span>
          </button>
        </div>
      </div>

      {/* Header Hero Banner */}
      <header className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#102438] via-[#17324d] to-[#1c3e60] px-6 py-10 text-white shadow-2xl md:px-14 md:py-14">
        <div className="absolute -right-20 -top-24 h-96 w-96 rounded-full bg-[#da8d50]/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-24 h-80 w-80 rounded-full bg-[#0068ff]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-400/20 px-3.5 py-1 text-xs font-bold tracking-widest text-[#fbd7a9] border border-amber-400/30">
              SAO BÉO · BẢN THẨM ĐỊNH HIỆN DIỆN SỐ
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300 border border-white/15">
              Dành riêng cho chủ cơ sở
            </span>
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[#d4a373]">
            {report.business.industry || "Dịch vụ địa phương"}
            {report.business.location ? ` · 📍 ${report.business.location}` : ""}
          </p>

          <h1 className="mt-2 text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl text-white tracking-tight">
            {report.business.name}
          </h1>

          <p className="mt-4 max-w-3xl text-sm md:text-lg leading-relaxed text-slate-200">
            {n.headline}
          </p>

          {/* Action Buttons in Hero */}
          <div className="mt-8 flex flex-wrap items-center gap-3 pt-6 border-t border-white/15">
            <a
              href={n.zaloConsultation.zaloHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#0068ff] px-7 py-3.5 text-xs md:text-sm font-extrabold text-white shadow-xl transition hover:bg-[#0052cc] inline-flex items-center gap-2"
            >
              <span>💬</span> Nhắn Zalo tư vấn 1-chạm
            </a>
            {demoSlug && (
              <a
                href={`/demo/${demoSlug}`}
                className="rounded-full bg-white/15 px-6 py-3.5 text-xs md:text-sm font-bold text-white backdrop-blur transition hover:bg-white/25 border border-white/25 inline-flex items-center gap-2"
              >
                <span>✨</span> Mở demo tương tác
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MODE 1: 60-SECOND EXECUTIVE QUICK PITCH (BẢN TÓM TẮT NHANH)              */}
      {/* ========================================================================= */}
      <div className={viewMode === "QUICK" ? "space-y-8 animate-in fade-in duration-200" : "hidden"}>
        {/* Executive Hook & Health Score Card */}
          <section className="relative -mt-6 mx-2 rounded-[2rem] bg-white p-6 shadow-xl md:mx-6 md:p-8 border border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900 border border-blue-200">
                  <span>⚡</span> Bản Tóm Tắt Nhanh (Dành 60 giây để đọc)
                </span>
                <h2 className="mt-2 text-xl md:text-2xl font-extrabold text-[#17324d]">
                  Sức khỏe hiện diện số &amp; Cơ hội bứt phá doanh thu
                </h2>
              </div>

              {/* Overall Score Gauge */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-[#fdfaf5] px-5 py-3 border-2 border-[#eddccb]">
                <span className="text-3xl md:text-4xl font-extrabold text-[#17324d]">{n.scorecard.overallScore}</span>
                <div className="text-xs leading-tight">
                  <span className="font-bold text-slate-800">/ 100 điểm</span>
                  <p className="mt-1 font-semibold text-[#a65f35]">
                    {n.scorecard.overallBand === "STRONG"
                      ? "Nền tảng tốt"
                      : n.scorecard.overallBand === "FAIR"
                      ? "Khá · Cần tối ưu trực tiếp"
                      : "Cần cải thiện khẩn cấp"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick 4 Pillars Bar */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {n.scorecard.pillars.map((p) => (
                <div key={p.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800 truncate">{p.label}</span>
                    <span className="text-[#17324d]">{p.score}/100</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressColor(p.score)}`}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 line-clamp-2">{p.finding}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 1 Core Gap ("Lỗ hổng cốt tử") */}
          <section className="rounded-[2rem] bg-amber-50/70 border-2 border-amber-200 p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-sm">
                ⚠️
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Lỗ hổng cốt tử khiến doanh thu bị thất thoát
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-extrabold text-amber-950">
              {n.lodgingSegment === "HOMESTAY"
                ? "Tốn 80% thời gian trả lời tin nhắn thủ công & thiếu kênh đón khách từ Google Maps"
                : n.lodgingSegment === "HOTEL"
                ? "Phụ thuộc quá nặng vào sàn OTA khiến mất 15% – 22% hoa hồng trên mỗi lượt đặt phòng"
                : n.lodgingSegment === "VILLA"
                ? "Thiếu trang đích tổng thể nguyên căn khiến thời gian chốt cọc khách đoàn kéo dài 2-3 ngày"
                : "Chưa có trang đích tối ưu khiến khách tìm kiếm trên mạng dễ rơi vào tay đối thủ"}
            </h3>

            <p className="mt-2.5 text-xs md:text-sm text-amber-900 leading-relaxed">
              {n.gaps[0]?.detail || n.scorecard.overallSummary}
            </p>
          </section>

          {/* High-Impact Visual Contrast: Before vs After */}
          <section className="rounded-[2rem] bg-gradient-to-br from-[#102438] to-[#17324d] p-6 text-white shadow-xl md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#f4c58b]">
                  So sánh trực quan
                </span>
                <h3 className="mt-1 text-xl md:text-2xl font-extrabold text-white">
                  Khác biệt thực tế: Trước &amp; Sau khi có Landing Page tối ưu
                </h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300 border border-white/15">
                Hiệu quả tức thì
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Before */}
              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-5">
                <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                  <span>✕</span> Hiện trạng (Cách làm cũ)
                </div>
                <ul className="mt-3 space-y-2 text-xs md:text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">•</span>
                    <span>{n.beforeVsAfter[0]?.before || "Khách nhắn tin hỏi giá, gửi 20 ảnh phòng thủ công, khách xem xong im lặng rời đi."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400">•</span>
                    <span>{n.beforeVsAfter[1]?.before || "Phụ thuộc vào bài đăng Facebook dễ bị trôi, mất khách tìm kiếm từ Google Maps."}</span>
                  </li>
                </ul>
              </div>

              {/* After */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <span>✓</span> Khi có Landing Page chuyên biệt
                </div>
                <ul className="mt-3 space-y-2 text-xs md:text-sm text-emerald-100">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{n.beforeVsAfter[0]?.after || "Gửi 1 link duy nhất: Khách xem trọn hình ảnh sắc nét, bảng giá minh bạch và tiện ích."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">•</span>
                    <span>{n.beforeVsAfter[0]?.benefit || "Nút đặt phòng 1-chạm qua Zalo đẩy thẳng ngày check-in, số khách -> Chốt cọc trong 3 phút."}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 Golden Metrics (ROI & Economic Impact) */}
          <section className="rounded-[2rem] bg-white p-6 shadow-sm md:p-8 border border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a65f35]">
              Dự phóng hiệu quả đầu tư (ROI)
            </span>
            <h3 className="mt-1.5 text-xl font-extrabold text-[#17324d]">
              3 Giá trị đo lường được sau khi triển khai
            </h3>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xl">⏳</span>
                <div className="mt-2 text-base md:text-lg font-bold text-slate-900">
                  {n.lodgingSegment === "HOMESTAY"
                    ? "Giảm 80% thời gian"
                    : n.lodgingSegment === "HOTEL"
                    ? "Giảm 15% – 22%"
                    : "Chốt trong 15 phút"}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {n.lodgingSegment === "HOMESTAY"
                    ? "thời gian nhắn tin tư vấn lặp đi lặp lại mỗi ngày."
                    : n.lodgingSegment === "HOTEL"
                    ? "chi phí hoa hồng phải chia cho sàn trung gian."
                    : "thay vì mất 2-3 ngày gửi thông tin rời rạc cho khách đoàn."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xl">📈</span>
                <div className="mt-2 text-base md:text-lg font-bold text-emerald-700">
                  {n.lodgingSegment === "HOMESTAY"
                    ? "+25% – 35%"
                    : n.lodgingSegment === "HOTEL"
                    ? "18 – 35 triệu/tháng"
                    : "Lấp đầy 4/4 tuần"}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {n.lodgingSegment === "HOMESTAY"
                    ? "tỷ lệ chốt cọc thành công từ các nguồn khách hỏi."
                    : n.lodgingSegment === "HOTEL"
                    ? "tiền hoa hồng giữ lại được khi khách Direct Booking."
                    : "tỷ lệ kín phòng cuối tuần của các đoàn khách VIP."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-2xl">💎</span>
                <div className="mt-2 text-base md:text-lg font-bold text-slate-900">
                  {n.lodgingSegment === "HOMESTAY"
                    ? "Tài sản số lâu dài"
                    : n.lodgingSegment === "HOTEL"
                    ? "Tệp khách trung thành"
                    : "Định vị xứng tầm"}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Website tốc độ cao, thuộc sở hữu riêng, không lo bị quét hay trôi bài đăng.
                </p>
              </div>
            </div>
          </section>

          {/* Conversion CTA Block in Quick Pitch */}
          <section className="rounded-[2.5rem] bg-gradient-to-br from-[#eddccb] via-[#faeee2] to-[#e6c49c] p-8 text-center shadow-xl border border-[#e2cdb9]">
            <span className="inline-flex rounded-full bg-amber-900/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#7a4623]">
              Hành động tiếp theo
            </span>
            <h2 className="mx-auto mt-3 max-w-2xl text-2xl md:text-3xl font-extrabold text-[#2c1e16]">
              Bạn muốn sở hữu một trang web tối ưu như bản demo cho {report.business.name}?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-xs md:text-sm text-[#5c402d] leading-relaxed">
              Trao đổi nhanh 5–10 phút qua Zalo để nhận định hướng chi tiết và xem báo giá phù hợp nhất.
            </p>

            <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
              <a
                className="rounded-full bg-[#0068ff] px-8 py-3.5 font-extrabold text-sm text-white shadow-xl transition hover:bg-[#0052cc] inline-flex items-center gap-2 transform hover:scale-105"
                href={n.zaloConsultation.zaloHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>💬</span> Nhắn Zalo trao đổi ngay
              </a>
              {demoSlug && (
                <a
                  className="rounded-full bg-[#17324d] px-7 py-3.5 font-bold text-sm text-white shadow-md transition hover:bg-[#102438] inline-flex items-center gap-2"
                  href={`/demo/${demoSlug}`}
                >
                  <span>✨</span> Xem Demo giao diện mẫu
                </a>
              )}
              <button
                type="button"
                onClick={() => setViewMode("FULL")}
                className="rounded-full border border-slate-700/30 bg-white/70 px-6 py-3.5 font-bold text-xs md:text-sm text-slate-800 transition hover:bg-white inline-flex items-center gap-1.5"
              >
                <span>📋</span> Xem báo cáo chi tiết 5 phần
              </button>
            </div>
          </section>
        </div>

      {/* ========================================================================= */}
      {/* MODE 2: DEEP COMPREHENSIVE AUDIT (BÁO CÁO THẨM ĐỊNH CHUYÊN SÂU 5 PHẦN)   */}
      {/* ========================================================================= */}
      <div className={viewMode === "FULL" ? "space-y-8 animate-in fade-in duration-200" : "hidden"}>
        {/* Executive Summary & Digital Health Scorecard */}
          <section className="relative -mt-6 mx-2 rounded-[2rem] bg-white p-7 shadow-xl md:mx-6 md:p-10 border border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <p className={eyebrow}>Bối cảnh &amp; Tóm tắt đánh giá</p>
              <span className="text-xs text-slate-400">
                Thời gian thẩm định: {new Date(report.generatedAt).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <p className="mt-3 leading-relaxed text-slate-600 text-sm md:text-base">{n.businessContext}</p>
            <h2 className="mt-5 text-xl font-bold md:text-2xl text-[#17324d]">{report.summary.headline}</h2>
            <p className="mt-3 leading-relaxed text-slate-600 text-sm md:text-base">{n.executiveSummary}</p>

            {/* Digital Health Scorecard 4 Pillars */}
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a65f35]">
                    Thẩm định sức khỏe hiện diện số
                  </span>
                  <h3 className="mt-1 text-xl font-extrabold md:text-2xl text-[#17324d]">
                    Đánh giá 4 trụ cột tiếp cận khách hàng
                  </h3>
                </div>

                {/* Overall Score Gauge */}
                <div className="flex items-center gap-3.5 rounded-2xl bg-[#fdfaf5] px-6 py-3.5 border-2 border-[#eddccb]">
                  <span className="text-4xl font-extrabold text-[#17324d]">{n.scorecard.overallScore}</span>
                  <div className="text-xs leading-tight">
                    <span className="font-bold text-slate-800">/ 100 điểm</span>
                    <p className="mt-1 font-semibold text-[#a65f35]">
                      {n.scorecard.overallBand === "STRONG"
                        ? "Nền tảng tốt"
                        : n.scorecard.overallBand === "FAIR"
                        ? "Mức khá · Cần tối ưu"
                        : "Cần cải thiện khẩn cấp"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-slate-600 text-xs md:text-sm leading-relaxed">{n.scorecard.overallSummary}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {n.scorecard.pillars.map((pillar) => (
                  <div
                    key={pillar.key}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 flex flex-col justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm md:text-base text-[#17324d]">{pillar.label}</h4>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${getBadgeStyle(pillar.status)}`}>
                          {pillar.statusLabel} · {pillar.score}/100
                        </span>
                      </div>

                      <div className="mt-3 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getProgressColor(pillar.score)}`}
                          style={{ width: `${pillar.score}%` }}
                        />
                      </div>

                      <p className="mt-3.5 text-xs md:text-sm text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Ghi nhận:</strong> {pillar.finding}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-200 text-xs text-[#a65f35] font-medium">
                      💡 <strong>Hướng cải thiện:</strong> {pillar.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 01 / Current Strengths */}
          <section className="rounded-[2rem] bg-white p-7 shadow-sm md:p-10 border border-slate-100">
            <p className={eyebrow}>01 / Bên mình đang làm tốt gì?</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {n.currentStrengths.map((item, index) => (
                <div
                  className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm"
                  key={item.title}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                      0{index + 1}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                  </div>
                  <p className="mt-3 text-xs md:text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 02 / Customer Journey & Before vs After */}
          <section className="rounded-[2rem] bg-gradient-to-br from-[#102438] to-[#17324d] p-7 text-white shadow-xl md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#f4c58b]">
                  02 / Khách hàng hiện đang trải nghiệm thế nào?
                </p>
                <h2 className="mt-2 text-2xl font-extrabold md:text-3xl text-white">
                  Hành trình từ lúc tìm kiếm đến lúc đưa ra quyết định
                </h2>
              </div>
              <span className="rounded-full bg-white/10 px-3.5 py-1 text-xs text-slate-300 border border-white/15">
                Mô hình chuyển đổi
              </span>
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-2 md:flex-row md:items-center">
              {n.customerJourney.map((step, index) => (
                <div className="contents" key={step}>
                  <div className="flex-1 rounded-2xl bg-white/10 px-4 py-4 text-center text-xs md:text-sm font-bold backdrop-blur border border-white/10 text-slate-100 shadow-sm">
                    {step}
                  </div>
                  {index < n.customerJourney.length - 1 && (
                    <span className="text-center font-bold text-[#f4c58b] text-sm">
                      <span className="md:hidden">↓</span>
                      <span className="hidden md:inline">→</span>
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Before vs After Bento Cards */}
            <div className="mt-12 pt-8 border-t border-white/15">
              <div className="text-xs font-bold uppercase tracking-wider text-[#f4c58b]">
                Bảng so sánh thực tế: Trước &amp; Sau khi tối ưu
              </div>
              <h3 className="mt-1.5 text-xl font-bold md:text-2xl text-white">
                Sự khác biệt rõ nét về trải nghiệm khách hàng &amp; hiệu quả kinh doanh
              </h3>

              <div className="mt-6 space-y-4">
                {n.beforeVsAfter.map((item, index) => (
                  <div key={item.aspect} className="rounded-2xl border border-white/15 bg-white/5 p-5 md:p-6 shadow-sm">
                    <div className="text-xs font-bold text-[#f4c58b] uppercase tracking-wider">
                      Tiêu chí 0{index + 1}: {item.aspect}
                    </div>
                    <div className="mt-3.5 grid gap-3.5 md:grid-cols-2">
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4">
                        <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                          <span>✕</span> Hiện trạng (Cách làm cũ)
                        </div>
                        <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed">{item.before}</p>
                      </div>

                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4">
                        <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs">
                          <span>✓</span> Sau khi có Landing Page tối ưu
                        </div>
                        <p className="mt-2 text-xs md:text-sm text-emerald-100 leading-relaxed">{item.after}</p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Giá trị thực tế: {item.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 03 / Gaps & Cost of Inaction */}
          <section className="rounded-[2rem] bg-white p-7 shadow-sm md:p-10 border border-slate-100">
            <p className={eyebrow}>03 / Điểm còn có thể tối ưu</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {n.gaps.map((item) => (
                <div
                  className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white p-6 shadow-sm"
                  key={item.title}
                >
                  <h2 className="text-base md:text-lg font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-xs md:text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Cost of Inaction & Segment-Specific Insights */}
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-slate-900 to-[#1b2533] p-6 md:p-8 text-white shadow-xl border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f4c58b]">
                    Góc nhìn kinh tế &amp; vận hành
                  </span>
                  <h3 className="mt-1 text-xl md:text-2xl font-extrabold text-white">{n.costOfInaction.headline}</h3>
                </div>
                <span
                  className={`rounded-full px-3.5 py-1 text-xs font-bold border ${
                    n.lodgingSegment === "HOMESTAY"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : n.lodgingSegment === "HOTEL"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : n.lodgingSegment === "VILLA"
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {n.lodgingSegment === "HOMESTAY"
                    ? "Tối ưu Inbox Facebook & Google Maps"
                    : n.lodgingSegment === "HOTEL"
                    ? "Tiết kiệm 15% – 22% phí hoa hồng OTA"
                    : n.lodgingSegment === "VILLA"
                    ? "Tăng tốc chốt cọc khách đoàn VIP"
                    : "Tối ưu hóa chuyển đổi trực tiếp"}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {n.costOfInaction.bulletPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3 text-xs md:text-sm text-slate-200 leading-relaxed">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">⚠️</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Tailored Segment Insight Box */}
              {n.lodgingSegment === "HOMESTAY" && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#f4c58b] mb-3">
                    📊 Hiệu quả thực tế khi có Landing Page tối ưu cho Homestay:
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Thời gian trực chat inbox</strong>
                      <div className="mt-1 text-lg font-bold text-emerald-400">Giảm 80% thời gian</div>
                      <span className="text-[11px] text-slate-400">Gửi 1 link xem trọn ảnh &amp; giá thay vì gửi 20 tin rời rạc</span>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Tỷ lệ chốt đơn từ Inbox &amp; Ads</strong>
                      <div className="mt-1 text-lg font-bold text-emerald-400">Tăng +25% – 35%</div>
                      <span className="text-[11px] text-slate-400">Khách mở trang đích ấn tượng, thấy đủ thông tin và chuyển cọc</span>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Doanh thu trực tiếp tăng thêm</strong>
                      <div className="mt-1 text-lg font-bold text-emerald-400">+5 – 15 triệu/tháng</div>
                      <span className="text-[11px] text-slate-400">Đón trọn khách du lịch từ Google Maps &amp; bài đăng về Zalo riêng</span>
                    </div>
                  </div>
                </div>
              )}

              {n.lodgingSegment === "HOTEL" && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#f4c58b] mb-3">
                    📊 Ước tính số tiền hoa hồng thất thoát hàng tháng qua sàn OTA (Booking / Agoda):
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Khách sạn 10–15 phòng</strong>
                      <div className="mt-1 text-lg font-bold text-rose-400">9.000.000đ – 15.000.000đ</div>
                      <span className="text-[11px] text-slate-400">mất cho sàn OTA mỗi tháng</span>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Khách sạn 20–30 phòng</strong>
                      <div className="mt-1 text-lg font-bold text-rose-400">18.000.000đ – 32.000.000đ</div>
                      <span className="text-[11px] text-slate-400">mất cho sàn OTA mỗi tháng</span>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Khách sạn 35+ phòng / Resort</strong>
                      <div className="mt-1 text-lg font-bold text-rose-400">35.000.000đ – 60.000.000đ+</div>
                      <span className="text-[11px] text-slate-400">mất cho sàn OTA mỗi tháng</span>
                    </div>
                  </div>
                </div>
              )}

              {n.lodgingSegment === "VILLA" && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#f4c58b] mb-3">
                    📊 Hiệu quả kinh tế đối với Villa &amp; Biệt thự nghỉ dưỡng nguyên căn:
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Tốc độ chốt cọc khách đoàn</strong>
                      <div className="mt-1 text-lg font-bold text-emerald-400">15 phút thay vì 2–3 ngày</div>
                      <span className="text-[11px] text-slate-400">Cả đoàn cùng xem chung link tổng thể căn và đồng thuận</span>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Tỷ lệ kín lịch cuối tuần</strong>
                      <div className="mt-1 text-lg font-bold text-emerald-400">Lấp đầy 4/4 tuần/tháng</div>
                      <span className="text-[11px] text-slate-400">Tối ưu các đợt khách đoàn gia đình và teambuilding</span>
                    </div>
                    <div className="rounded-lg bg-black/30 p-3.5 border border-white/10">
                      <strong className="block text-slate-300 font-semibold">Định vị giá trị dịch vụ</strong>
                      <div className="mt-1 text-lg font-bold text-emerald-400">+15% – 20% giá trị phòng</div>
                      <span className="text-[11px] text-slate-400">Website sang trọng xứng tầm căn villa cao cấp</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-xl bg-emerald-950/50 p-4 border border-emerald-500/30 text-xs md:text-sm text-emerald-200 leading-relaxed">
                <strong className="text-emerald-300">💡 Cơ hội phục hồi doanh thu:</strong> {n.costOfInaction.opportunityGain}
              </div>
            </div>
          </section>

          {/* 04 / Value Hypotheses */}
          <section className="rounded-[2rem] bg-white p-7 shadow-sm md:p-10 border border-slate-100">
            <p className={eyebrow}>04 / Nếu bổ sung website hoặc tối ưu demo, giá trị nằm ở đâu?</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {n.valueHypotheses.map((item, index) => (
                <div
                  className="rounded-2xl bg-[#faf6ef] p-6 border border-[#eadfce] flex flex-col justify-between"
                  key={item.title}
                >
                  <div>
                    <span className="text-xs font-bold text-[#a65f35]">0{index + 1}</span>
                    <h2 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h2>
                    <p className="mt-2 text-xs md:text-sm leading-relaxed text-slate-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 05 / Recommended Plan */}
          <section className="rounded-[2rem] bg-white p-7 shadow-sm md:p-10 border border-slate-100">
            <p className={eyebrow}>05 / Phương án phù hợp nhất</p>
            <ol className="mt-6 space-y-4">
              {n.recommendedPlan.map((item) => (
                <li
                  className="flex items-start gap-4 rounded-2xl border border-slate-200/80 p-5 bg-slate-50/50"
                  key={item.step}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17324d] font-extrabold text-white text-sm">
                    {item.step}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                    <p className="mt-1 text-xs md:text-sm leading-relaxed text-slate-600">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Concept Image (if generated) */}
          {conceptImagePath && (
            <section id="concept" className="overflow-hidden rounded-[2.5rem] bg-[#1a1411] text-white shadow-2xl">
              <div className="p-7 md:p-10">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#f4c58b]">Concept giao diện</p>
                <h2 className="mt-3 text-2xl md:text-3xl font-bold">Một hướng hình ảnh để mình dễ hình dung trước</h2>
                <p className="mt-2 text-xs md:text-sm text-slate-300">
                  Đây là hình minh họa phong cách, không phải ảnh thật của cơ sở hoặc website chính thức.
                </p>
              </div>
              <div className="relative aspect-[16/10]">
                <Image
                  src={conceptImagePath}
                  fill
                  sizes="(max-width: 1024px) 100vw, 960px"
                  className="object-cover"
                  alt={`Hình minh họa concept cho ${report.business.name}`}
                />
              </div>
            </section>
          )}

          {/* 07 / CTA Section with Direct Zalo Action */}
          <section className="rounded-[2.5rem] bg-gradient-to-br from-[#eddccb] via-[#faeee2] to-[#e6c49c] p-8 text-center shadow-xl md:p-14 border border-[#e2cdb9]">
            <span className="inline-flex rounded-full bg-amber-900/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#7a4623]">
              Bước tiếp theo
            </span>
            <h2 className="mx-auto mt-4 max-w-3xl text-2xl md:text-4xl font-extrabold text-[#2c1e16] tracking-tight">
              {n.primaryCTA}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-xs md:text-base leading-relaxed text-[#5c402d]">
              Nếu hướng tiếp cận này hữu ích cho mục tiêu kinh doanh của anh/chị, mình có thể trao đổi ngắn 5–10 phút qua Zalo; hoàn toàn không bắt buộc hay ép buộc quyết định ngay.
            </p>

            <div className="mt-8 flex flex-wrap justify-center items-center gap-3.5">
              <a
                className="rounded-full bg-[#0068ff] px-8 py-4 font-extrabold text-sm md:text-base text-white shadow-2xl transition hover:bg-[#0052cc] inline-flex items-center gap-2 transform hover:scale-105"
                href={n.zaloConsultation.zaloHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>💬</span> Nhắn Zalo trao đổi nhanh
              </a>
              {demoSlug && (
                <a
                  className="rounded-full bg-[#17324d] px-8 py-4 font-extrabold text-sm md:text-base text-white shadow-2xl transition hover:bg-[#102438] inline-flex items-center gap-2"
                  href={`/demo/${demoSlug}`}
                >
                  <span>✨</span> Mở demo tương tác
                </a>
              )}
              {conceptImagePath && (
                <a
                  className="rounded-full border border-[#17324d] px-7 py-4 font-bold text-xs md:text-sm text-[#17324d] transition hover:bg-black/5"
                  href="#concept"
                >
                  Xem concept giao diện
                </a>
              )}
            </div>
          </section>
        </div>

      {/* Footer */}
      <footer className="py-12 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Báo cáo Thẩm định Hiện diện Số được thực hiện bởi Sao Béo</p>
        <p className="mt-1">Dành riêng cho {report.business.name} · Ngày tạo: {new Date(report.generatedAt).toLocaleDateString("vi-VN")}</p>
      </footer>

      {/* Mobile Sticky CTA Bar */}
      <div className="fixed inset-x-4 bottom-4 z-40 flex gap-2 md:hidden">
        {demoSlug && (
          <a
            className="flex-1 rounded-2xl bg-[#17324d] px-4 py-3.5 text-center text-xs font-bold text-white shadow-2xl flex items-center justify-center gap-1"
            href={`/demo/${demoSlug}`}
          >
            <span>📱</span> Mở demo
          </a>
        )}
        <a
          className="flex-1 rounded-2xl bg-[#0068ff] px-4 py-3.5 text-center text-xs font-bold text-white shadow-2xl inline-flex items-center justify-center gap-1.5"
          href={n.zaloConsultation.zaloHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>💬</span> Nhắn Zalo
        </a>
      </div>
    </article>
  );
}
