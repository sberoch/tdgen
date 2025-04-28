/*
  Warnings:

  - You are about to drop the column `jobDescriptionId` on the `JobTask` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "JobDescriptionTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobTaskId" INTEGER NOT NULL,
    "jobDescriptionId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "percentage" REAL NOT NULL,
    CONSTRAINT "JobDescriptionTask_jobTaskId_fkey" FOREIGN KEY ("jobTaskId") REFERENCES "JobTask" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobDescriptionTask_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" INTEGER,
    "deletedAt" DATETIME,
    "deletedById" INTEGER,
    CONSTRAINT "JobTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JobTask_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JobTask_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobTask" ("createdAt", "createdById", "deletedAt", "deletedById", "id", "metadata", "text", "title", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "deletedAt", "deletedById", "id", "metadata", "text", "title", "updatedAt", "updatedById" FROM "JobTask";
DROP TABLE "JobTask";
ALTER TABLE "new_JobTask" RENAME TO "JobTask";
CREATE UNIQUE INDEX "JobTask_title_key" ON "JobTask"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "JobDescriptionTask_jobTaskId_jobDescriptionId_key" ON "JobDescriptionTask"("jobTaskId", "jobDescriptionId");
