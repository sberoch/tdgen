-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobDescription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" TEXT,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "lockedAt" DATETIME,
    "lockedById" TEXT,
    "lockExpiry" DATETIME,
    "isLockedForUsers" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_JobDescription" ("createdAt", "createdById", "deletedAt", "deletedById", "id", "lockExpiry", "lockedAt", "lockedById", "metadata", "title", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "deletedAt", "deletedById", "id", "lockExpiry", "lockedAt", "lockedById", "metadata", "title", "updatedAt", "updatedById" FROM "JobDescription";
DROP TABLE "JobDescription";
ALTER TABLE "new_JobDescription" RENAME TO "JobDescription";
CREATE UNIQUE INDEX "JobDescription_title_key" ON "JobDescription"("title");
CREATE TABLE "new_JobTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" TEXT,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "lockedAt" DATETIME,
    "lockedById" TEXT,
    "lockExpiry" DATETIME,
    "isLockedForUsers" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_JobTask" ("createdAt", "createdById", "deletedAt", "deletedById", "id", "lockExpiry", "lockedAt", "lockedById", "metadata", "text", "title", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "deletedAt", "deletedById", "id", "lockExpiry", "lockedAt", "lockedById", "metadata", "text", "title", "updatedAt", "updatedById" FROM "JobTask";
DROP TABLE "JobTask";
ALTER TABLE "new_JobTask" RENAME TO "JobTask";
CREATE UNIQUE INDEX "JobTask_title_key" ON "JobTask"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
