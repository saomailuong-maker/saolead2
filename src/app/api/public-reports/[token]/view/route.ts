import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { recordPublicReportView } from "../../../../../features/public-audit/repository";

export const dynamic = "force-dynamic";
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params; const existing = request.cookies.get("saobeo_report_viewer")?.value; const viewerId = existing && /^[A-Za-z0-9_-]{20,100}$/.test(existing) ? existing : randomBytes(24).toString("base64url");
  const result = await recordPublicReportView({ token, viewerId, userAgent: request.headers.get("user-agent"), referrer: request.headers.get("referer") });
  const response = NextResponse.json({ counted: result.counted }, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } });
  if (!existing) response.cookies.set("saobeo_report_viewer", viewerId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}
