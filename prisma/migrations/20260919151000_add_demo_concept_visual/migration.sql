ALTER TABLE "LeadDemo"
ADD COLUMN "conceptStatus" TEXT,
ADD COLUMN "conceptPreset" TEXT,
ADD COLUMN "conceptImagePath" TEXT,
ADD COLUMN "conceptPrompt" TEXT,
ADD COLUMN "conceptModel" TEXT,
ADD COLUMN "conceptGeneratedAt" TIMESTAMP(3),
ADD COLUMN "conceptErrorCode" TEXT;
