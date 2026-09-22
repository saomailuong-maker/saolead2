import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicDemo } from "../../../features/demo-generator/repository";
import { DemoRenderer } from "../../../features/demo-generator/render";
import { DemoViewTracker } from "../../../features/demo-generator/view-tracker";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const defaultMetadata: Metadata = {
  title: "Phương án giao diện minh họa | Sao Béo",
  description: "Bản thử nghiệm giao diện di động và liên hệ 1 chạm.",
  robots: { index: false, follow: false, nocache: true },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicSlug: string }>;
}): Promise<Metadata> {
  const { publicSlug } = await params;
  try {
    const access = await getPublicDemo(publicSlug);
    if (access.kind === "PUBLISHED") {
      const name = access.brief.brand.businessName;
      const title = `Bản Thử Giao Diện Di Động — ${name}`;
      const description = `Trải nghiệm thử giao diện xem phòng, bảng giá và đặt phòng 1 chạm trên iPhone 16 Pro dành riêng cho ${name}.`;
      return {
        title,
        description,
        robots: { index: false, follow: false, nocache: true },
        openGraph: {
          title,
          description,
          type: "website",
        },
      };
    }
  } catch {
    // fallback
  }
  return defaultMetadata;
}

export default async function PublicDemoPage({ params }: { params: Promise<{ publicSlug: string }> }) {
  const { publicSlug } = await params;
  const access = await getPublicDemo(publicSlug);
  if (access.kind !== "PUBLISHED") notFound();
  return (
    <>
      <DemoViewTracker slug={publicSlug} />
      <DemoRenderer
        brief={access.brief}
        content={access.content}
        preset={access.preset}
        conceptImagePath={access.conceptImagePath}
        reportHref={access.reportToken ? `/r/${access.reportToken}` : null}
      />
    </>
  );
}
