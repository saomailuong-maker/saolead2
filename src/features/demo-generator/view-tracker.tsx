"use client";
import { useEffect } from "react";
export function DemoViewTracker({ slug }: { slug: string }) { useEffect(() => { void fetch(`/api/public-demos/${encodeURIComponent(slug)}/view`, { method: "POST", credentials: "same-origin", cache: "no-store", keepalive: true }); }, [slug]); return null; }
