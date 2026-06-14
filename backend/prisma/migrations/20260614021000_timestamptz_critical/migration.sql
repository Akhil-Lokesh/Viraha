-- DM-1: restore TIMESTAMPTZ on time-semantic-critical columns that regressed to
-- `timestamp without time zone`. Existing values were written as UTC, so reinterpret
-- them as UTC instants. (created_at/updated_at left as a tracked follow-up.)
ALTER TABLE "refresh_tokens"     ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "password_resets"    ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "email_verifications" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "posts"              ALTER COLUMN "posted_at"  TYPE TIMESTAMPTZ USING "posted_at"  AT TIME ZONE 'UTC';
ALTER TABLE "time_capsules"      ALTER COLUMN "open_at"    TYPE TIMESTAMPTZ USING "open_at"    AT TIME ZONE 'UTC';
