/*
  Warnings:

  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PermissionToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_userId_key";

-- DropIndex
DROP INDEX "_PermissionToUser_B_index";

-- DropIndex
DROP INDEX "_PermissionToUser_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Permission";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_PermissionToUser";
PRAGMA foreign_keys=on;

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
    "deletedById" TEXT
);
INSERT INTO "new_JobDescription" ("createdAt", "createdById", "deletedAt", "deletedById", "id", "metadata", "title", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "deletedAt", "deletedById", "id", "metadata", "title", "updatedAt", "updatedById" FROM "JobDescription";
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
    "deletedById" TEXT
);
INSERT INTO "new_JobTask" ("createdAt", "createdById", "deletedAt", "deletedById", "id", "metadata", "text", "title", "updatedAt", "updatedById") SELECT "createdAt", "createdById", "deletedAt", "deletedById", "id", "metadata", "text", "title", "updatedAt", "updatedById" FROM "JobTask";
DROP TABLE "JobTask";
ALTER TABLE "new_JobTask" RENAME TO "JobTask";
CREATE UNIQUE INDEX "JobTask_title_key" ON "JobTask"("title");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
