-- Hot-path and geo-proximity indexes (DM-01, PERF-05, PERF-08, PERF-09)
CREATE INDEX "posts_location_lat_location_lng_idx" ON "posts"("location_lat", "location_lng");
CREATE INDEX "posts_save_count_idx" ON "posts"("save_count");
CREATE INDEX "posts_location_city_idx" ON "posts"("location_city");
CREATE INDEX "posts_location_country_idx" ON "posts"("location_country");
CREATE INDEX "journal_entries_location_lat_location_lng_idx" ON "journal_entries"("location_lat", "location_lng");
CREATE INDEX "place_notes_location_lat_location_lng_idx" ON "place_notes"("location_lat", "location_lng");
CREATE INDEX "want_to_go_location_lat_location_lng_idx" ON "want_to_go"("location_lat", "location_lng");

-- Report.reporterId: make nullable and add FK with ON DELETE SET NULL (DM-02)
-- Preserves reports for moderation when the reporting account is deleted.
ALTER TABLE "reports" ALTER COLUMN "reporter_id" DROP NOT NULL;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- PlaceNote: allow exactly one un-keyed (placeId IS NULL) note per user (DM-04)
-- A standard @@unique([userId, placeId]) does not constrain NULL placeId rows.
CREATE UNIQUE INDEX "place_notes_user_id_no_place_key" ON "place_notes"("user_id") WHERE "place_id" IS NULL;
