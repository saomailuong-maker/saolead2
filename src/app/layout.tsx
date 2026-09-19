import type { Metadata } from "next";
import { getActor } from "../lib/auth";
import { AppShell } from "../components/app-shell";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = { title: "SAOBEO LEAD", description: "CRM khách hàng tiềm năng của Sao Béo" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const actor = await getActor();
  return <html lang="vi" className={cn("font-sans", geist.variable)}><body><AppShell actorName={actor?.user.name ?? null}>{children}</AppShell></body></html>;
}
