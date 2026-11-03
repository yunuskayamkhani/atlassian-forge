import { BitbucketApiError, toFailureResult, type Result } from '../services/bitbucket/errors';
import { getRepository, listRepositories } from '../services/bitbucket/repositories';
import { assertAppAdmin } from '../services/config/admins';
import type { Repository } from '../models/repository';
import { DASHBOARD_WORKSPACE_SLUG, isAllowedRepositoryFullName } from '../services/config/dashboardAllowlist';
import { listWorkspaces } from '../services/bitbucket/workspaces';

export async function getRepositories(payload: unknown): Promise<Result<Repository[]>> {
  const workspaceId =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>).workspaceId : undefined;

  try {
    await assertAppAdmin();
    const workspace = (await listWorkspaces()).find(
      (item) => item.id === workspaceId && item.slug.toLowerCase() === DASHBOARD_WORKSPACE_SLUG
    );
    if (!workspace) {
      throw new BitbucketApiError('Select the approved Bitbucket workspace.', 403, false);
    }
    const data = (await listRepositories(workspace.id)).filter((repository) =>
      isAllowedRepositoryFullName(repository.fullName)
    );
    return { ok: true, data };
  } catch (error) {
    return toFailureResult(error);
  }
}

export async function getRepositoryDetails(payload: unknown): Promise<Result<Repository>> {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

  try {
    await assertAppAdmin();
    const workspace = (await listWorkspaces()).find(
      (item) =>
        item.id === record.workspaceId && item.slug.toLowerCase() === DASHBOARD_WORKSPACE_SLUG
    );
    if (!workspace) {
      throw new BitbucketApiError('Only approved Bitbucket repositories are available.', 403, false);
    }
    if (typeof record.repositoryId !== 'string' || !record.repositoryId) {
      throw new BitbucketApiError('Select an approved Bitbucket repository.', 400, false);
    }
    const repository = await getRepository(workspace.id, record.repositoryId);
    if (!isAllowedRepositoryFullName(repository.fullName)) {
      throw new BitbucketApiError('Only approved Bitbucket repositories are available.', 403, false);
    }
    return {
      ok: true,
      data: repository
    };
  } catch (error) {
    return toFailureResult(error);
  }
}
