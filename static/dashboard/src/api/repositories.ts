import { invokeResult } from './invokeResult';
import type { Repository, Result } from '../types/models';

export function fetchRepositories(workspaceId: string): Promise<Result<Repository[]>> {
  return invokeResult<Repository[]>('getRepositories', { workspaceId });
}

export function fetchRepository(workspaceId: string, repositoryId: string): Promise<Result<Repository>> {
  return invokeResult<Repository>('getRepository', { workspaceId, repositoryId });
}
