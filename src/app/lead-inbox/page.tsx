import Link from "next/link";
import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { createCrmLeadFromInbox, setInboxStatus } from "../../features/discovery/actions";

function openingHours(value: unknown) {
  if (!value || typeof value !== "object") return "—";
  const descriptions = "weekdayDescriptions" in value && Array.isArray(value.weekdayDescriptions) ? value.weekdayDescriptions.filter((line): line is string => typeof line === "string") : [];
  return descriptions.length ? descriptions.join(" · ") : "Có dữ liệu giờ mở cửa";
}

export default async function LeadInbox({ searchParams }: { searchParams: Promise<{ added?: string; existing?: string; error?: string; page?: string }> }) {
  const actor = await requireActor(); const p = await searchParams;
  const page = Math.min(100, Math.max(1, Number.parseInt(p.page || "1", 10) || 1));
  const [total, items] = await Promise.all([
    db.discoveredBusiness.count({ where: { workspaceId: actor.workspaceId } }),
    db.discoveredBusiness.findMany({
      where: { workspaceId: actor.workspaceId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 10,
      take: 10,
    }),
  ]);
  return <div className="space-y-5"><div className="flex justify-between items-start"><div><h1 className="text-3xl font-bold">Lead Inbox</h1><p className="mt-1 text-slate-500">Xác nhận doanh nghiệp trước khi đưa vào CRM.</p></div><Link href="/discover" className="btn">Tìm khách hàng</Link></div>
    {p.added && <p className="card p-3 text-green-700">Đã thêm vào Lead Inbox.</p>}{p.existing && <p className="card p-3 text-amber-700">Đã có trong Lead Inbox.</p>}{p.error && <p className="card p-3 text-red-700">Trạng thái đã thay đổi. Vui lòng thử lại.</p>}
    <div className="card divide-y"><div className="p-4 flex justify-between"><span className="font-bold">Doanh nghiệp ({total})</span><span className="text-xs text-[#5e5e5e]" translate="no">Google Maps</span></div>{items.map((item) => <div key={item.id} className="p-4 grid xl:grid-cols-[2fr_1fr_1.2fr_1.2fr_1fr_1.2fr_2fr] gap-3 items-start text-sm"><div><div className="font-semibold">{item.name || `Place ID: ${item.externalId}`}</div><div className="text-slate-500">{item.address || item.location}</div><div className="text-xs text-slate-500 mt-1">Nguồn: Google Maps</div></div><div>{item.industry}</div><div><div>{item.phone || "Chưa có điện thoại"}</div>{item.websiteUrl ? <a className="text-blue-600 break-all" href={item.websiteUrl} target="_blank" rel="noreferrer">Website</a> : <div className="text-slate-500">Chưa có website</div>}</div><div><div>{item.rating != null ? `${item.rating}/5` : "Chưa có rating"}</div><div className="text-slate-500">{item.reviewCount != null ? `${item.reviewCount} đánh giá` : "—"}</div></div><div className="text-slate-500">{openingHours(item.openingHours)}</div><div><div className="font-medium">{item.detailsStatus}</div>{item.detailsStatus === "FAILED" && <p className="text-amber-700 mt-1">Không tải được thông tin chi tiết. Vẫn có thể tạo CRM Lead.</p>}</div><div className="space-y-2"><div className="font-medium">{item.status}</div>{item.status !== "CRM_CREATED" && <div className="flex gap-3">{item.status !== "QUALIFIED" && <form action={setInboxStatus}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="QUALIFIED"/><button type="submit" className="text-blue-600">Qualify</button></form>}{item.status !== "REJECTED" && <form action={setInboxStatus}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="REJECTED"/><button type="submit" className="text-red-600">Reject</button></form>}</div>}{item.status === "QUALIFIED" && <form action={createCrmLeadFromInbox} className="space-y-2"><input type="hidden" name="id" value={item.id}/><label className="label">Tên đã xác nhận</label><input name="businessName" required minLength={2} defaultValue={item.name || ""}/><label className="label">Địa chỉ đã xác nhận</label><input name="locationText" defaultValue={item.address || item.location}/><button type="submit" className="btn text-xs">Create CRM Lead</button></form>}{item.status === "CRM_CREATED" && item.crmLeadId && <Link href={`/leads/${item.crmLeadId}`} className="text-blue-600">Xem CRM Lead</Link>}</div></div>)}{!items.length && <p className="p-8 text-center text-slate-500">Chưa có doanh nghiệp trong Lead Inbox.</p>}</div><div className="flex gap-4 text-sm">{page > 1 && <Link href={`/lead-inbox?page=${page - 1}`} className="text-blue-600">← Trang trước</Link>}{page * 10 < total && <Link href={`/lead-inbox?page=${page + 1}`} className="text-blue-600">Trang sau →</Link>}</div></div>;
}
