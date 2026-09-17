-- CreateEnum
CREATE TYPE "InboxStatus" AS ENUM ('UNREVIEWED', 'QUALIFIED', 'REJECTED', 'CRM_CREATED');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "sourceExternalId" TEXT,
ADD COLUMN     "sourceType" TEXT;

-- CreateTable
CREATE TABLE "SearchSession" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "resultPlaceIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveredBusiness" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "InboxStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "searchSessionId" UUID NOT NULL,
    "crmLeadId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveredBusiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchSession_workspaceId_createdAt_idx" ON "SearchSession"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscoveredBusiness_workspaceId_status_createdAt_idx" ON "DiscoveredBusiness"("workspaceId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveredBusiness_provider_externalId_key" ON "DiscoveredBusiness"("provider", "externalId");

-- AddForeignKey
ALTER TABLE "SearchSession" ADD CONSTRAINT "SearchSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredBusiness" ADD CONSTRAINT "DiscoveredBusiness_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveredBusiness" ADD CONSTRAINT "DiscoveredBusiness_searchSessionId_fkey" FOREIGN KEY ("searchSessionId") REFERENCES "SearchSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
