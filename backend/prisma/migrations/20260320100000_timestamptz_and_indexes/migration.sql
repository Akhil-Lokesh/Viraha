-- Convert all TIMESTAMP(3) columns to TIMESTAMPTZ for timezone safety
-- Using AT TIME ZONE 'UTC' to preserve existing values

-- users
ALTER TABLE "users" ALTER COLUMN "last_login_at" TYPE TIMESTAMPTZ USING "last_login_at" AT TIME ZONE 'UTC';
ALTER TABLE "users" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "users" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC';

-- posts
ALTER TABLE "posts" ALTER COLUMN "taken_at" TYPE TIMESTAMPTZ USING "taken_at" AT TIME ZONE 'UTC';
ALTER TABLE "posts" ALTER COLUMN "posted_at" TYPE TIMESTAMPTZ USING "posted_at" AT TIME ZONE 'UTC';
ALTER TABLE "posts" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "posts" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC';

-- refresh_tokens
ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "refresh_tokens" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';

-- password_resets
ALTER TABLE "password_resets" ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ USING "expires_at" AT TIME ZONE 'UTC';
ALTER TABLE "password_resets" ALTER COLUMN "used_at" TYPE TIMESTAMPTZ USING "used_at" AT TIME ZONE 'UTC';
ALTER TABLE "password_resets" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';

-- follows
ALTER TABLE "follows" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';

-- comments
ALTER TABLE "comments" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "comments" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC';

-- saves
ALTER TABLE "saves" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';

-- activities
ALTER TABLE "activities" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';

-- albums
ALTER TABLE "albums" ALTER COLUMN "start_date" TYPE TIMESTAMPTZ USING "start_date" AT TIME ZONE 'UTC';
ALTER TABLE "albums" ALTER COLUMN "end_date" TYPE TIMESTAMPTZ USING "end_date" AT TIME ZONE 'UTC';
ALTER TABLE "albums" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "albums" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC';

-- album_posts
ALTER TABLE "album_posts" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';

-- journals
ALTER TABLE "journals" ALTER COLUMN "start_date" TYPE TIMESTAMPTZ USING "start_date" AT TIME ZONE 'UTC';
ALTER TABLE "journals" ALTER COLUMN "end_date" TYPE TIMESTAMPTZ USING "end_date" AT TIME ZONE 'UTC';
ALTER TABLE "journals" ALTER COLUMN "published_at" TYPE TIMESTAMPTZ USING "published_at" AT TIME ZONE 'UTC';
ALTER TABLE "journals" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "journals" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC';

-- journal_entries
ALTER TABLE "journal_entries" ALTER COLUMN "date" TYPE TIMESTAMPTZ USING "date" AT TIME ZONE 'UTC';
ALTER TABLE "journal_entries" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "journal_entries" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC';

-- reports
ALTER TABLE "reports" ALTER COLUMN "created_at" TYPE TIMESTAMPTZ USING "created_at" AT TIME ZONE 'UTC';
ALTER TABLE "reports" ALTER COLUMN "updated_at" TYPE TIMESTAMPTZ USING "updated_at" AT TIME ZONE 'UTC';

-- GIN index on posts.tags for array searches
CREATE INDEX IF NOT EXISTS "idx_posts_tags_gin" ON "posts" USING GIN ("tags");

-- Partial index for unread activities (optimizes notification badge query)
CREATE INDEX IF NOT EXISTS "idx_activities_unread" ON "activities" ("user_id", "created_at" DESC) WHERE "read" = false;
