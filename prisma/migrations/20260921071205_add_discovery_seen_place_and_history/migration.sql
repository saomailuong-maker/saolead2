-- AlterTable
ALTER TABLE "SearchSession" ADD COLUMN     "mode" TEXT DEFAULT 'STANDARD',
ADD COLUMN     "nextPageToken" TEXT,
ADD COLUMN     "searchStats" JSONB;

-- CreateTable
CREATE TABLE "DiscoverySeenPlace" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "location" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "seenCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSearchSessionId" UUID,

    CONSTRAINT "DiscoverySeenPlace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscoverySeenPlace_workspaceId_location_industry_idx" ON "DiscoverySeenPlace"("workspaceId", "location", "industry");

-- CreateIndex
CREATE INDEX "DiscoverySeenPlace_workspaceId_provider_externalId_idx" ON "DiscoverySeenPlace"("workspaceId", "provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscoverySeenPlace_workspaceId_provider_externalId_key" ON "DiscoverySeenPlace"("workspaceId", "provider", "externalId");

-- AddForeignKey
ALTER TABLE "DiscoverySeenPlace" ADD CONSTRAINT "DiscoverySeenPlace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
