import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { assertDeploymentQuery, listDeployments } from '../services/bitbucket/deployments';
import { requireMappedRepo } from '../services/config/mappings';
import type { Deployment } from '../models/deployment';

export async function getDeployments(payload: unknown): Promise<Result<Deployment[]>> {
  try {
    const { workspaceId, repositoryId } = assertDeploymentQuery(payload);
    await requireMappedRepo(workspaceId, repositoryId);
    const data = await listDeployments(workspaceId, repositoryId);
    console.log(`getDeployments -> ${data.length} deployments`);
    return { ok: true, data };
  } catch (error) {
    console.error('getDeployments failed', error);
    return toFailureResult(error);
  }
}
