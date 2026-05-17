import { prisma } from '../lib/prisma';
import * as sseRegistry from '../lib/sseRegistry';

interface CreateActivityParams {
  userId: string;
  actorId: string;
  type: 'follow' | 'follow_request' | 'follow_accepted' | 'comment' | 'reply' | 'save' | 'like';
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

  // Push live notification to connected SSE listeners (no-op if none)
  sseRegistry.push(userId, 'activity', {
    id: activity.id,
    type,
    actorId,
    postId: postId || null,
    commentId: commentId || null,
    createdAt: activity.createdAt.toISOString(),
  });
}
