import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicDemo } from "../../../features/demo-generator/repository";
import { DemoRenderer } from "../../../features/demo-generator/render";
import { DemoViewTracker } from "../../../features/demo-generator/view-tracker";
export const dynamic = "force-dynamic"; export const revalidate = 0;
export const metadata: Metadata = { title: "Phương án giao diện minh họa | Sao Béo", robots: { index: false, follow: false, nocache: true } };
export default async function PublicDemoPage({ params }: { params: Promise<{ publicSlug: string }> }) { const { publicSlug } = await params; const access = await getPublicDemo(publicSlug); if (access.kind !== "PUBLISHED") notFound(); return <><DemoViewTracker slug={publicSlug}/><DemoRenderer brief={access.brief} content={access.content} preset={access.preset} conceptImagePath={access.conceptImagePath} reportHref={access.reportToken ? `/r/${access.reportToken}` : null}/></>; }
