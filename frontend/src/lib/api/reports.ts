import apiClient from './client';

interface ReportInput {
  targetType: 'post' | 'comment' | 'user' | 'journal';
  targetId: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'other';
  details?: string;
}

export async function createReport(input: ReportInput): Promise<void> {
  await apiClient.post('/reports', input);
}
