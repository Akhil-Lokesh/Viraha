import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { computeMomentsForUser } from '../services/virahaEngine';

const BATCH_SIZE = 100;
const ACTIVE_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Recompute Viraha Moments for recently active users.
 *
 * `computeMomentsForUser` is per-user, so we iterate users in cursor-paginated
 * batches. Cost is bounded by only considering active accounts that logged in
 * within the last ACTIVE_WINDOW_DAYS. Per-user failures are logged and do not
 * abort the rest of the run.
 */
export async function runVirahaMomentsRecompute(): Promise<void> {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_DAYS * DAY_MS);
  let cursor: string | undefined;
  let processed = 0;
  let momentsCreated = 0;
  let failures = 0;

  for (;;) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        lastLoginAt: { gte: activeSince },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (users.length === 0) break;

    for (const user of users) {
      try {
        momentsCreated += await computeMomentsForUser(user.id);
      } catch (err) {
        failures += 1;
        logger.error({ err, userId: user.id }, 'virahaMomentsRecompute: failed for user');
      }
      processed += 1;
    }

    cursor = users[users.length - 1]?.id;
    if (users.length < BATCH_SIZE) break;
  }

  logger.info(
    { processed, momentsCreated, failures },
    'virahaMomentsRecompute: run complete'
  );
}
