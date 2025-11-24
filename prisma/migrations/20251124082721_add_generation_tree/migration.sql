-- AlterTable
ALTER TABLE "AIGeneration" ADD COLUMN     "enhancedPrompt" TEXT,
ADD COLUMN     "isChosen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "iterationGroup" TEXT,
ADD COLUMN     "parentGenerationId" TEXT,
ADD COLUMN     "postProcessing" JSONB;

-- CreateIndex
CREATE INDEX "AIGeneration_parentGenerationId_idx" ON "AIGeneration"("parentGenerationId");

-- CreateIndex
CREATE INDEX "AIGeneration_iterationGroup_idx" ON "AIGeneration"("iterationGroup");

-- AddForeignKey
ALTER TABLE "AIGeneration" ADD CONSTRAINT "AIGeneration_parentGenerationId_fkey" FOREIGN KEY ("parentGenerationId") REFERENCES "AIGeneration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
