-- Add entities to AI summaries
ALTER TABLE "ai_summaries"
ADD COLUMN "entities" JSONB;

-- Create bias analysis table
CREATE TABLE "bias_analysis" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "bias_score" DOUBLE PRECISION NOT NULL,
    "tone" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "signals" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "bias_analysis_pkey" PRIMARY KEY ("id")
);


-- Unique story_id
CREATE UNIQUE INDEX "bias_analysis_story_id_key"
ON "bias_analysis"("story_id");

-- Foreign key
ALTER TABLE "bias_analysis"
ADD CONSTRAINT "bias_analysis_story_id_fkey"
FOREIGN KEY ("story_id")
REFERENCES "stories"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;
