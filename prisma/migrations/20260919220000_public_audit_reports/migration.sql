CREATE TYPE "PublicReportStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE "PublicAuditReport" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "publicToken" TEXT NOT NULL,
    "status" "PublicReportStatus" NOT NULL DEFAULT 'ACTIVE',
    "snapshot" JSONB NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "firstViewedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicAuditReport_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PublicAuditReportView" (
    "id" UUID NOT NULL,
    "reportId" UUID NOT NULL,
    "viewerHash" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicAuditReportView_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicAuditReport_publicToken_key" ON "PublicAuditReport"("publicToken");
CREATE INDEX "PublicAuditReport_leadId_createdAt_idx" ON "PublicAuditReport"("leadId", "createdAt");
CREATE INDEX "PublicAuditReport_workspaceId_createdAt_idx" ON "PublicAuditReport"("workspaceId", "createdAt");
CREATE INDEX "PublicAuditReportView_reportId_viewedAt_idx" ON "PublicAuditReportView"("reportId", "viewedAt");
CREATE INDEX "PublicAuditReportView_reportId_viewerHash_viewedAt_idx" ON "PublicAuditReportView"("reportId", "viewerHash", "viewedAt");
ALTER TABLE "PublicAuditReport" ADD CONSTRAINT "PublicAuditReport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicAuditReport" ADD CONSTRAINT "PublicAuditReport_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicAuditReportView" ADD CONSTRAINT "PublicAuditReportView_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "PublicAuditReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
