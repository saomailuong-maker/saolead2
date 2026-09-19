"use client";

import { useEffect } from "react";
export function PublicReportViewTracker({ token }: { token: string }) { useEffect(() => { void fetch(`/api/public-reports/${encodeURIComponent(token)}/view`, { method: "POST", credentials: "same-origin", cache: "no-store", keepalive: true }); }, [token]); return null; }
