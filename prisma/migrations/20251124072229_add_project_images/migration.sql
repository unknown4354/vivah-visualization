-- CreateTable
CREATE TABLE "ProjectImage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectImage_projectId_idx" ON "ProjectImage"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectImage" ADD CONSTRAINT "ProjectImage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
