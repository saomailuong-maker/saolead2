import packageJson from "../../../package.json";
import { requireActor } from "../../lib/auth";
import { preferredQuota } from "../../features/discovery/diagnostics";
import { providerDiagnosticsSchema } from "../../features/discovery/diagnostics";
import { getSystemStatus } from "../../features/system-status/status";

export default async function SystemStatusPage() {
  const { workspaceId } = await requireActor();
  const status = await getSystemStatus(workspaceId);
  const parsed = providerDiagnosticsSchema.safeParse(status.provider ? { transport: status.provider.transport, operation: status.provider.operation, status: status.provider.status, errorKind: status.provider.errorKind, httpStatus: status.provider.httpStatus, providerCode: status.provider.providerCode, providerMessage: status.provider.providerMessage, durationMs: status.provider.durationMs, quota: status.provider.quota } : null);
  const provider = parsed.success ? parsed.data : null;
  const quota = preferredQuota(provider?.quota ?? null);
  return <div className="space-y-5"><div><h1 className="text-3xl font-bold">Trạng thái hệ thống</h1><p className="mt-1 text-slate-500">Kiểm tra nhanh ứng dụng, cơ sở dữ liệu và Places provider.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <section className="card p-5"><h2 className="font-bold">Ứng dụng</h2><p className="mt-3 text-green-700">Đang hoạt động</p><p className="mt-2 text-sm text-slate-500">Node {process.version} · SAOBEO LEAD {packageJson.version}</p></section>
    <section className="card p-5"><h2 className="font-bold">Cơ sở dữ liệu</h2><p className={`mt-3 ${status.database.ok ? "text-green-700" : "text-red-700"}`}>{status.database.ok ? "Kết nối OK" : "Không thể kết nối"}</p><p className="mt-2 text-sm text-slate-500">Phản hồi: {status.database.responseTimeMs} ms</p></section>
    <section className="card p-5"><h2 className="font-bold">Places</h2><p className="mt-3">Transport: {status.places.transport}</p><p className="mt-2">Cấu hình: {status.places.configured ? "Có" : "Thiếu"}</p></section>
    <section className="card p-5"><h2 className="font-bold">OpenAI</h2><p className="mt-3">Cấu hình: {status.openAI.configured ? "Có" : "Thiếu"}</p><p className="mt-2 text-sm text-slate-500">Model: {status.openAI.model}</p><p className="mt-2 text-sm">Lần tạo gần nhất: {status.outreachDraft ? `${status.outreachDraft.status} · ${status.outreachDraft.model}` : "Chưa có"}</p></section>
    <section className="card p-5 md:col-span-2"><h2 className="font-bold">Provider gần nhất</h2>{provider ? <dl className="mt-3 grid gap-3 sm:grid-cols-3"><div><dt className="text-sm text-slate-500">Trạng thái</dt><dd>{provider.status === "SUCCESS" ? "Thành công" : `Lỗi ${provider.errorKind ?? "PROVIDER"}`}</dd></div><div><dt className="text-sm text-slate-500">HTTP</dt><dd>{provider.httpStatus ?? "—"}</dd></div><div><dt className="text-sm text-slate-500">Quota còn lại / reset</dt><dd>{quota ? `${quota.remaining ?? "—"} / ${quota.reset ?? "—"}` : "Không có dữ liệu quota từ provider."}</dd></div></dl> : <p className="mt-3 text-slate-500">Chưa có request provider nào được ghi nhận.</p>}</section>
    <section className="card p-5"><h2 className="font-bold">Website Audit gần nhất</h2>{status.websiteScan ? <p className="mt-3">{status.websiteScan.status} · HTTP {status.websiteScan.httpStatus ?? "—"}</p> : <p className="mt-3 text-slate-500">Chưa có dữ liệu.</p>}</section>
  </div></div>;
}
