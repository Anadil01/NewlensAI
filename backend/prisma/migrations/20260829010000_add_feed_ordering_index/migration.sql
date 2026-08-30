CREATE INDEX "stories_points_id_idx"
ON "stories" ("points" DESC NULLS LAST, "id" ASC);
