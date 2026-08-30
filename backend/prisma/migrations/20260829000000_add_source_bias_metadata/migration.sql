CREATE TYPE "SourcePoliticalLean" AS ENUM (
    'LEFT', 'CENTER_LEFT', 'CENTER', 'CENTER_RIGHT', 'RIGHT', 'UNKNOWN'
);

ALTER TABLE "sources"
    ADD COLUMN "political_lean" "SourcePoliticalLean" NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN "reliability_score" DOUBLE PRECISION;

ALTER TABLE "sources"
    ADD CONSTRAINT "sources_reliability_score_check"
    CHECK ("reliability_score" IS NULL OR ("reliability_score" >= 0 AND "reliability_score" <= 1));
