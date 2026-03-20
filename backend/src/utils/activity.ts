import { prisma } from '../lib/prisma';

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

  await prisma.activity.create({
    data: {
      userId,
      actorId,
      type,
      postId: postId || null,
      commentId: commentId || null,
    },
  });
}
