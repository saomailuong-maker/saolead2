import { requireActor } from "../../lib/auth";
import { db } from "../../lib/db";
import { OutreachQueue, type QueueLead } from "../../features/sales-assistant/outreach-queue";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const actor = await requireActor();

  const leads = await db.lead.findMany({
    where: {
      workspaceId: actor.workspaceId,
      archivedAt: null,
      phone: { not: null },
    },
    orderBy: [
      // Put NEW stage leads first, then by createdAt desc
      { stage: "asc" },
      { createdAt: "desc" },
    ],
    take: 100,
    select: {
      id: true,
      businessName: true,
      phone: true,
      industry: true,
      locationText: true,
      websiteUrl: true,
      stage: true,
      createdAt: true,
    },
  });

  const serializedLeads: QueueLead[] = leads.map((l) => ({
    id: l.id,
    businessName: l.businessName,
    phone: l.phone,
    industry: l.industry,
    locationText: l.locationText,
    websiteUrl: l.websiteUrl,
    stage: l.stage,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <OutreachQueue initialLeads={serializedLeads} />
    </div>
  );
}
