-- AlterTable
ALTER TABLE "JobDescription" ADD COLUMN "lockExpiry" DATETIME;
ALTER TABLE "JobDescription" ADD COLUMN "lockedAt" DATETIME;
ALTER TABLE "JobDescription" ADD COLUMN "lockedById" TEXT;

-- AlterTable
ALTER TABLE "JobTask" ADD COLUMN "lockExpiry" DATETIME;
ALTER TABLE "JobTask" ADD COLUMN "lockedAt" DATETIME;
ALTER TABLE "JobTask" ADD COLUMN "lockedById" TEXT;
