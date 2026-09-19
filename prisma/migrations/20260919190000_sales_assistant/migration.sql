CREATE TABLE "OutreachDraft" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "leadId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "strategy" JSONB NOT NULL,
    "inputDigest" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OutreachDraft_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OutreachDraft_leadId_createdAt_idx" ON "OutreachDraft"("leadId", "createdAt");
CREATE INDEX "OutreachDraft_workspaceId_createdAt_idx" ON "OutreachDraft"("workspaceId", "createdAt");
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
