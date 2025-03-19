-- CreateTable
CREATE TABLE "JobDescription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "metadata" JSONB NOT NULL
);
