import { requireActor } from "../../lib/auth";
import { SearchForm } from "../../features/discovery/search-form";
export default async function Discover() { await requireActor(); return <div className="space-y-5"><div><h1 className="text-3xl font-bold">Tìm khách hàng</h1><p className="mt-1 text-slate-500">Tìm doanh nghiệp địa phương và chọn đưa vào Lead Inbox.</p></div><SearchForm/></div>; }
