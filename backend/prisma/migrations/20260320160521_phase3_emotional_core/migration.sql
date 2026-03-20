/*
  Warnings:

  - You are about to drop the column `primary_location` on the `albums` table. All the data in the column will be lost.
  - You are about to alter the column `weather_temp` on the `journal_entries` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.
  - You are about to drop the column `primary_location` on the `journals` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `home_location` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "albums_primary_location_gist_idx";

-- DropIndex
DROP INDEX "journals_primary_location_gist_idx";

-- DropIndex
DROP INDEX "idx_posts_tags_gin";

-- DropIndex
DROP INDEX "posts_location_gist_idx";

-- DropIndex
DROP INDEX "users_home_location_gist_idx";

-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "album_posts" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "albums" DROP COLUMN "primary_location",
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "follows" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "journal_entries" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "weather_temp" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "journals" DROP COLUMN "primary_location",
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "published_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "password_resets" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "used_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "location",
ALTER COLUMN "taken_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "posted_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "expires_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "reports" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "saves" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "home_location",
ALTER COLUMN "last_login_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "viraha_moments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "reference_type" VARCHAR(20) NOT NULL,
    "reference_id" UUID NOT NULL,
    "thumbnail" TEXT,
    "location_name" VARCHAR(255),
    "years_ago" INTEGER,
    "moment_date" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viraha_moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journeys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'auto',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_posts" (
    "id" UUID NOT NULL,
    "journey_id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_notes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "location_lat" DECIMAL(65,30) NOT NULL,
    "location_lng" DECIMAL(65,30) NOT NULL,
    "location_name" VARCHAR(255),
    "location_city" VARCHAR(100),
    "location_country" VARCHAR(100),
    "place_id" VARCHAR(255),
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "want_to_go" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "location_lat" DECIMAL(65,30) NOT NULL,
    "location_lng" DECIMAL(65,30) NOT NULL,
    "location_name" VARCHAR(255),
    "location_city" VARCHAR(100),
    "location_country" VARCHAR(100),
    "place_id" VARCHAR(255),
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'dreaming',
    "visited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "want_to_go_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_capsules" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "location_name" VARCHAR(255),
    "location_lat" DECIMAL(65,30),
    "location_lng" DECIMAL(65,30),
    "type" VARCHAR(20) NOT NULL DEFAULT 'departure',
    "sealed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "open_at" TIMESTAMP(3) NOT NULL,
    "is_opened" BOOLEAN NOT NULL DEFAULT false,
    "opened_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_capsules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrapbooks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrapbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrapbook_items" (
    "id" UUID NOT NULL,
    "scrapbook_id" UUID NOT NULL,
    "item_type" VARCHAR(20) NOT NULL,
    "reference_id" UUID,
    "content" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrapbook_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "viraha_moments_user_id_delivered_at_idx" ON "viraha_moments"("user_id", "delivered_at");

-- CreateIndex
CREATE INDEX "viraha_moments_user_id_type_idx" ON "viraha_moments"("user_id", "type");

-- CreateIndex
CREATE INDEX "journeys_user_id_start_date_idx" ON "journeys"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "journeys_user_id_status_idx" ON "journeys"("user_id", "status");

-- CreateIndex
CREATE INDEX "journey_posts_journey_id_sort_order_idx" ON "journey_posts"("journey_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "journey_posts_journey_id_post_id_key" ON "journey_posts"("journey_id", "post_id");

-- CreateIndex
CREATE INDEX "place_notes_user_id_idx" ON "place_notes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "place_notes_user_id_place_id_key" ON "place_notes"("user_id", "place_id");

-- CreateIndex
CREATE INDEX "want_to_go_user_id_status_idx" ON "want_to_go"("user_id", "status");

-- CreateIndex
CREATE INDEX "want_to_go_user_id_created_at_idx" ON "want_to_go"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "time_capsules_user_id_is_opened_idx" ON "time_capsules"("user_id", "is_opened");

-- CreateIndex
CREATE INDEX "time_capsules_open_at_is_opened_idx" ON "time_capsules"("open_at", "is_opened");

-- CreateIndex
CREATE INDEX "scrapbooks_user_id_created_at_idx" ON "scrapbooks"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "scrapbook_items_scrapbook_id_sort_order_idx" ON "scrapbook_items"("scrapbook_id", "sort_order");

-- AddForeignKey
ALTER TABLE "viraha_moments" ADD CONSTRAINT "viraha_moments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journeys" ADD CONSTRAINT "journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_posts" ADD CONSTRAINT "journey_posts_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_posts" ADD CONSTRAINT "journey_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_notes" ADD CONSTRAINT "place_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "want_to_go" ADD CONSTRAINT "want_to_go_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_capsules" ADD CONSTRAINT "time_capsules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrapbooks" ADD CONSTRAINT "scrapbooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrapbook_items" ADD CONSTRAINT "scrapbook_items_scrapbook_id_fkey" FOREIGN KEY ("scrapbook_id") REFERENCES "scrapbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
