import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { recordPublicDemoView } from "../../../../../features/demo-generator/repository";
export const dynamic = "force-dynamic";
export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const jar = await cookies(); const h = await headers(); let viewerId = jar.get("saobeo_demo_viewer")?.value; const created = !viewerId; if (!viewerId) viewerId = randomBytes(18).toString("base64url"); const result = await recordPublicDemoView({ slug, viewerId, userAgent: h.get("user-agent"), referrer: h.get("referer") }); const response = NextResponse.json(result, { headers: { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow, noarchive" } }); if (created) response.cookies.set("saobeo_demo_viewer", viewerId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 86400 }); return response; }
