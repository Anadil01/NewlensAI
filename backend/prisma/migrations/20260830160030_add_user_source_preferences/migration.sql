-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('LIKE', 'DISLIKE');

-- DropIndex
DROP INDEX "stories_points_id_idx";

-- CreateTable
CREATE TABLE "story_feedback" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "feedback" "FeedbackType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_source_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "preference" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_source_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "story_feedback_user_id_feedback_idx" ON "story_feedback"("user_id", "feedback");

-- CreateIndex
CREATE UNIQUE INDEX "story_feedback_user_id_story_id_key" ON "story_feedback"("user_id", "story_id");

-- CreateIndex
CREATE INDEX "user_source_preferences_source_id_idx" ON "user_source_preferences"("source_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_source_preferences_user_id_source_id_key" ON "user_source_preferences"("user_id", "source_id");

-- AddForeignKey
ALTER TABLE "story_feedback" ADD CONSTRAINT "story_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_feedback" ADD CONSTRAINT "story_feedback_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_source_preferences" ADD CONSTRAINT "user_source_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_source_preferences" ADD CONSTRAINT "user_source_preferences_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
