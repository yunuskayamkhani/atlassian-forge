import { invokeResult } from './invokeResult';
import type { PullRequest, Result } from '../types/models';

export function fetchPullRequests(
  workspaceId: string,
  repositoryId: string,
  prStatus: string
): Promise<Result<PullRequest[]>> {
  return invokeResult<PullRequest[]>('getPullRequests', { workspaceId, repositoryId, prStatus });
}
