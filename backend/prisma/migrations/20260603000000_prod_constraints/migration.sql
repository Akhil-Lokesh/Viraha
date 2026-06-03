-- Production schema constraints (C16, C20, C21)

-- VirahaMoment: dedup key so createMany({ skipDuplicates: true }) actually dedupes (C16).
-- Remove pre-existing duplicate (user_id, type, reference_id, moment_date) rows that
-- accumulated under the old no-op skipDuplicates, keeping one per key (tie-break on id),
-- so the unique index can be created on previously-dirty data.
DELETE FROM "viraha_moments" a
USING "viraha_moments" b
WHERE a."user_id" = b."user_id"
  AND a."type" = b."type"
  AND a."reference_id" = b."reference_id"
  AND a."moment_date" = b."moment_date"
  AND a."id" > b."id";

CREATE UNIQUE INDEX "viraha_moments_user_id_type_reference_id_moment_date_key" ON "viraha_moments"("user_id", "type", "reference_id", "moment_date");

-- User.createdAt: index for searchUsers ORDER BY created_at DESC (C20)
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- Report dedup: remove pre-existing duplicate (reporter_id, target_type, target_id) rows
-- keeping the earliest, so the unique index can be created on dirty data (C21).
-- Tie-break on id when created_at is identical so exactly one row per key survives.
DELETE FROM "reports" a
USING "reports" b
WHERE a."reporter_id" = b."reporter_id"
  AND a."target_type" = b."target_type"
  AND a."target_id" = b."target_id"
  AND (a."created_at" > b."created_at"
       OR (a."created_at" = b."created_at" AND a."id" > b."id"));

-- Report: enforce one report per (reporter, target) — atomic dedup, catch P2002 -> 409 (C21)
CREATE UNIQUE INDEX "reports_reporter_id_target_type_target_id_key" ON "reports"("reporter_id", "target_type", "target_id");
