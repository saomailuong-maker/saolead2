CREATE TABLE "ProviderRequestLog" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "searchSessionId" UUID,
    "transport" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorKind" TEXT,
    "httpStatus" INTEGER,
    "providerCode" TEXT,
    "providerMessage" TEXT,
    "durationMs" INTEGER,
    "quota" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderRequestLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProviderRequestLog_workspaceId_createdAt_idx" ON "ProviderRequestLog"("workspaceId", "createdAt");
CREATE INDEX "ProviderRequestLog_searchSessionId_createdAt_idx" ON "ProviderRequestLog"("searchSessionId", "createdAt");
ALTER TABLE "ProviderRequestLog" ADD CONSTRAINT "ProviderRequestLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderRequestLog" ADD CONSTRAINT "ProviderRequestLog_searchSessionId_fkey" FOREIGN KEY ("searchSessionId") REFERENCES "SearchSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
