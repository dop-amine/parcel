/*
  Warnings:

  - You are about to drop the column `artistId` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Earning` table. All the data in the column will be lost.
  - You are about to drop the column `artistId` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `genre` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the `License` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `audioUrl` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Earning" DROP CONSTRAINT "Earning_trackId_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_trackId_fkey";

-- DropForeignKey
ALTER TABLE "License" DROP CONSTRAINT "License_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_trackId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_userId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_ownerId_fkey";

-- AlterTable
ALTER TABLE "Earning" DROP COLUMN "artistId",
DROP COLUMN "type",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Track" DROP COLUMN "artistId",
DROP COLUMN "duration",
DROP COLUMN "genre",
DROP COLUMN "ownerId",
DROP COLUMN "status",
DROP COLUMN "url",
ADD COLUMN     "audioUrl" TEXT NOT NULL,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "License";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Purchase";

-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Play" ADD CONSTRAINT "Play_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earning" ADD CONSTRAINT "Earning_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
