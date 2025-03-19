/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `JobDescription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "JobDescription_title_key" ON "JobDescription"("title");
