import { invokeResult } from './invokeResult';
import type { Deployment, Result } from '../types/models';

export function fetchDeployments(
  workspaceId: string,
  repositoryId: string
): Promise<Result<Deployment[]>> {
  return invokeResult<Deployment[]>('getDeployments', { workspaceId, repositoryId });
}
