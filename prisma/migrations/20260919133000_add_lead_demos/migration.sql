CREATE TYPE "DemoStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE "LeadDemo" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "leadId" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "preset" TEXT NOT NULL,
  "status" "DemoStatus" NOT NULL DEFAULT 'DRAFT',
  "brief" JSONB NOT NULL,
  "content" JSONB NOT NULL,
  "publicSlug" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "firstViewedAt" TIMESTAMP(3),
  "lastViewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadDemo_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LeadDemoView" (
  "id" UUID NOT NULL,
  "demoId" UUID NOT NULL,
  "viewerHash" TEXT,
  "userAgent" TEXT,
  "referrer" TEXT,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadDemoView_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LeadDemo_publicSlug_key" ON "LeadDemo"("publicSlug");
CREATE INDEX "LeadDemo_leadId_createdAt_idx" ON "LeadDemo"("leadId", "createdAt");
CREATE INDEX "LeadDemo_workspaceId_createdAt_idx" ON "LeadDemo"("workspaceId", "createdAt");
CREATE INDEX "LeadDemoView_demoId_viewedAt_idx" ON "LeadDemoView"("demoId", "viewedAt");
CREATE INDEX "LeadDemoView_demoId_viewerHash_viewedAt_idx" ON "LeadDemoView"("demoId", "viewerHash", "viewedAt");
ALTER TABLE "LeadDemo" ADD CONSTRAINT "LeadDemo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadDemo" ADD CONSTRAINT "LeadDemo_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadDemoView" ADD CONSTRAINT "LeadDemoView_demoId_fkey" FOREIGN KEY ("demoId") REFERENCES "LeadDemo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
