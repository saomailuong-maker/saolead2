ALTER TABLE "LeadDemo"
ADD COLUMN "conceptHttpStatus" INTEGER,
ADD COLUMN "conceptProviderCode" TEXT,
ADD COLUMN "conceptSafeMessage" TEXT;

UPDATE "LeadDemo" SET "conceptStatus" = 'GENERATING' WHERE "conceptStatus" = 'PROCESSING';
UPDATE "LeadDemo" SET "conceptStatus" = 'SUCCESS' WHERE "conceptStatus" = 'READY';
UPDATE "LeadDemo" SET "conceptStatus" = 'ERROR' WHERE "conceptStatus" = 'FAILED';
