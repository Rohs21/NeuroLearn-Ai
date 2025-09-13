/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "walletAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");
