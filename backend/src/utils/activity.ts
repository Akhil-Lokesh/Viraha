import { prisma } from '../lib/prisma';
import { publishActivity } from '../lib/realtime';
import { logger } from '../lib/logger';

interface CreateActivityParams {
  userId: string;
  actorId: string;
  type: 'follow' | 'follow_request' | 'follow_accepted' | 'comment' | 'reply' | 'save';
  postId?: string;
  commentId?: string;
}

export async function createActivity(params: CreateActivityParams): Promise<void> {
  const { userId, actorId, type, postId, commentId } = params;

  // Don't create notification for yourself
  if (userId === actorId) return;

  const activity = await prisma.activity.create({
    data: {
      userId,
      actorId,
      type,
      postId: postId || null,
      commentId: commentId || null,
    },
  });

  // Real-time delivery is best-effort — never fail the originating request.
  try {
    await publishActivity(userId, {
      type,
      actorId,
      postId: postId ?? null,
      commentId: commentId ?? null,
      createdAt: activity.createdAt.toISOString(),
    });
  } catch (err) {
    logger.debug({ err }, 'Failed to publish realtime activity');
  }
}
