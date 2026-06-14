-- BE-4: guard posts.like_count against drift into negative values (concurrent
-- unlike races). Reset any pre-existing negatives to 0 so the constraint applies.
UPDATE "posts" SET "like_count" = 0 WHERE "like_count" < 0;
ALTER TABLE "posts" ADD CONSTRAINT "posts_like_count_nonneg" CHECK ("like_count" >= 0);
