-- This is an empty migration.

ALTER TABLE "reading_history"
ADD CONSTRAINT "reading_history_duration_seconds_check"
CHECK ("duration_seconds" IS NULL OR "duration_seconds" >= 0);

ALTER TABLE "user_preferences"
ADD CONSTRAINT "user_preferences_preference_check"
CHECK ("preference" >= -5 AND "preference" <= 5);