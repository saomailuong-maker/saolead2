-- CreateEnum
CREATE TYPE "DetailsStatus" AS ENUM ('NOT_FETCHED', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "DiscoveredBusiness" ADD COLUMN     "address" TEXT,
ADD COLUMN     "businessStatus" TEXT,
ADD COLUMN     "detailsErrorCode" TEXT,
ADD COLUMN     "detailsFetchedAt" TIMESTAMP(3),
ADD COLUMN     "detailsStatus" "DetailsStatus" NOT NULL DEFAULT 'NOT_FETCHED',
ADD COLUMN     "name" TEXT,
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "reviewCount" INTEGER,
ADD COLUMN     "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "SearchSession" ADD COLUMN     "resultsJson" JSONB;
