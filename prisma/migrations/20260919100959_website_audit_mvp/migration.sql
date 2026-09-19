-- CreateEnum
CREATE TYPE "WebsiteScanStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "WebsiteScan" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "requestedUrl" TEXT NOT NULL,
    "finalUrl" TEXT,
    "status" "WebsiteScanStatus" NOT NULL DEFAULT 'PENDING',
    "httpStatus" INTEGER,
    "durationMs" INTEGER,
    "redirectCount" INTEGER,
    "checks" JSONB,
    "findings" JSONB,
    "errorCode" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsiteScan_leadId_createdAt_idx" ON "WebsiteScan"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteScan_workspaceId_createdAt_idx" ON "WebsiteScan"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "WebsiteScan" ADD CONSTRAINT "WebsiteScan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteScan" ADD CONSTRAINT "WebsiteScan_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
