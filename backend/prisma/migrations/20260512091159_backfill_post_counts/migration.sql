-- Backfill denormalized counters on posts table.
-- Existing rows have comment_count = 0 and save_count = 0 from schema default,
-- even though comments and saves may already exist. Recompute from source tables.

UPDATE posts
SET comment_count = (
  SELECT COUNT(*)
  FROM comments
  WHERE comments.post_id = posts.id
    AND comments.is_deleted = false
);

UPDATE posts
SET save_count = (
  SELECT COUNT(*)
  FROM saves
  WHERE saves.post_id = posts.id
);
