import { invokeResult } from './invokeResult';
import type { Commit, Result } from '../types/models';

export function fetchCommits(
  workspaceId: string,
  repositoryId: string,
  prStatus: string,
  dateFrom: number | null
): Promise<Result<Commit[]>> {
  return invokeResult<Commit[]>('getCommits', { workspaceId, repositoryId, prStatus, dateFrom });
}
