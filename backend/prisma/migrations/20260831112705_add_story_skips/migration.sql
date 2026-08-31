-- CreateTable
CREATE TABLE "story_skips" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_skips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "story_skips_user_id_idx" ON "story_skips"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_skips_user_id_story_id_key" ON "story_skips"("user_id", "story_id");

-- AddForeignKey
ALTER TABLE "story_skips" ADD CONSTRAINT "story_skips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_skips" ADD CONSTRAINT "story_skips_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
