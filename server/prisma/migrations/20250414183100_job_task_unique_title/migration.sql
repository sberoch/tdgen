/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `JobTask` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "JobTask_title_key" ON "JobTask"("title");
