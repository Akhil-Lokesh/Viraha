-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Post: add showLocation field
ALTER TABLE "posts" ADD COLUMN "show_location" BOOLEAN NOT NULL DEFAULT true;

-- Post: add composite index
CREATE INDEX "posts_user_id_privacy_posted_at_idx" ON "posts"("user_id", "privacy", "posted_at");

-- Album: add startDate, endDate, viewCount
ALTER TABLE "albums" ADD COLUMN "start_date" TIMESTAMP(3);
ALTER TABLE "albums" ADD COLUMN "end_date" TIMESTAMP(3);
ALTER TABLE "albums" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;

-- Journal: add startDate, endDate, wordCount, viewCount, publishedAt
ALTER TABLE "journals" ADD COLUMN "start_date" TIMESTAMP(3);
ALTER TABLE "journals" ADD COLUMN "end_date" TIMESTAMP(3);
ALTER TABLE "journals" ADD COLUMN "word_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "journals" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "journals" ADD COLUMN "published_at" TIMESTAMP(3);

-- JournalEntry: add weather fields
ALTER TABLE "journal_entries" ADD COLUMN "weather_condition" VARCHAR(50);
ALTER TABLE "journal_entries" ADD COLUMN "weather_temp" DECIMAL;
ALTER TABLE "journal_entries" ADD COLUMN "weather_unit" VARCHAR(10);

-- Activity: add composite index
CREATE INDEX "activities_user_id_created_at_idx" ON "activities"("user_id", "created_at");

-- PostGIS geography columns
ALTER TABLE "posts" ADD COLUMN "location" geography(POINT, 4326);
ALTER TABLE "albums" ADD COLUMN "primary_location" geography(POINT, 4326);
ALTER TABLE "journals" ADD COLUMN "primary_location" geography(POINT, 4326);
ALTER TABLE "users" ADD COLUMN "home_location" geography(POINT, 4326);

-- Populate geography columns from existing Decimal lat/lng
UPDATE "posts"
  SET "location" = ST_SetSRID(ST_MakePoint("location_lng"::float, "location_lat"::float), 4326)::geography
  WHERE "location_lat" IS NOT NULL AND "location_lng" IS NOT NULL;

UPDATE "users"
  SET "home_location" = ST_SetSRID(ST_MakePoint("home_lng"::float, "home_lat"::float), 4326)::geography
  WHERE "home_lat" IS NOT NULL AND "home_lng" IS NOT NULL;

-- GiST spatial indexes
CREATE INDEX "posts_location_gist_idx" ON "posts" USING GIST ("location");
CREATE INDEX "albums_primary_location_gist_idx" ON "albums" USING GIST ("primary_location");
CREATE INDEX "journals_primary_location_gist_idx" ON "journals" USING GIST ("primary_location");
CREATE INDEX "users_home_location_gist_idx" ON "users" USING GIST ("home_location");
