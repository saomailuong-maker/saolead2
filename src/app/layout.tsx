import type { Metadata } from "next";
import { getActor } from "../lib/auth";
import { AppShell } from "../components/app-shell";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const appUrl =
  process.env.PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://saolead.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "SAOBEO LEAD",
  description: "Hệ thống Tối ưu Hiện diện Số & Tiếp cận Khách hàng Trực tiếp",
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const actor = await getActor();
  return <html lang="vi" className={cn("font-sans", geist.variable)}><body><AppShell actorName={actor?.user.name ?? null}>{children}</AppShell></body></html>;
}
