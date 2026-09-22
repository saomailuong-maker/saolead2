import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicReport } from "../../../features/public-audit/repository";
import { PublicReportViewTracker } from "../../../features/public-audit/view-tracker";
import { buildReportNarrative } from "../../../features/public-audit/presentation";
import { PublicAuditReportView } from "../../../features/public-audit/report-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Báo cáo Thẩm định Hiện diện Số | Sao Béo",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PublicAuditReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const access = await getPublicReport(token);
  if (access.kind === "NOT_FOUND") notFound();
  if (access.kind !== "ACTIVE") {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-20">
        <div className="rounded-3xl border bg-white p-8 text-center shadow-sm">
          <div className="font-bold tracking-[.2em] text-[#8a5b35]">SAO BÉO</div>
          <h1 className="mt-8 text-2xl font-bold">
            {access.kind === "REVOKED"
              ? "Báo cáo này không còn khả dụng."
              : "Báo cáo này đã hết hạn."}
          </h1>
          <p className="mt-3 text-slate-500">
            Vui lòng liên hệ chuyên viên tư vấn nếu anh/chị cần một bản cập nhật mới nhất.
          </p>
        </div>
      </main>
    );
  }

  const report = access.snapshot;
  const narrative = buildReportNarrative(report);

  return (
    <main className="min-h-screen bg-[#faf7f2] text-[#242e38] font-sans pb-16">
      <PublicReportViewTracker token={token} />
      <PublicAuditReportView
        token={token}
        report={report}
        narrative={narrative}
        demoSlug={access.demoSlug}
        conceptImagePath={access.conceptImagePath}
      />
    </main>
  );
}
