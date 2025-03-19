-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobDescriptionId" INTEGER,
    CONSTRAINT "JobTask_jobDescriptionId_fkey" FOREIGN KEY ("jobDescriptionId") REFERENCES "JobDescription" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_JobTask" ("createdAt", "id", "metadata", "text", "title", "updatedAt") SELECT "createdAt", "id", "metadata", "text", "title", "updatedAt" FROM "JobTask";
DROP TABLE "JobTask";
ALTER TABLE "new_JobTask" RENAME TO "JobTask";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
