-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "currentImageUrl" TEXT,
ADD COLUMN     "editHistory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "model3DUrl" TEXT,
ADD COLUMN     "sourceImageUrl" TEXT;
