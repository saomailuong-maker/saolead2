"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "../app/actions";

export function AppShell({ actorName, children }: { actorName: string | null; children: React.ReactNode }) {
  const pathname = usePathname(); if (pathname.startsWith("/r/")) return <>{children}</>;
  return <div className="min-h-screen md:flex">{actorName && <aside className="bg-[#111c32] text-white md:w-60 shrink-0 p-5 flex md:flex-col gap-5"><Link href="/" className="font-bold tracking-wide text-lg">✦ SAOBEO LEAD</Link><nav className="flex md:flex-col gap-2 text-sm overflow-x-auto"><Link className="p-2 hover:bg-white/10 rounded" href="/">Tổng quan</Link><Link className="p-2 hover:bg-white/10 rounded" href="/discover">Tìm khách hàng</Link><Link className="p-2 hover:bg-white/10 rounded" href="/lead-inbox">Lead Inbox</Link><Link className="p-2 hover:bg-white/10 rounded" href="/leads">Leads</Link><Link className="p-2 hover:bg-white/10 rounded" href="/pipeline">Pipeline</Link><Link className="p-2 hover:bg-white/10 rounded" href="/tasks">Công việc</Link><Link className="p-2 hover:bg-white/10 rounded" href="/system-status">Hệ thống</Link></nav><div className="hidden md:block mt-auto text-xs text-slate-300">{actorName}<form action={logout}><button className="mt-2 underline">Đăng xuất</button></form></div></aside>}<main className="min-w-0 flex-1 p-4 md:p-8 max-w-[1600px]">{children}</main></div>;
}
