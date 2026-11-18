import { BitbucketApiError, toFailureResult, type Result } from '../services/bitbucket/errors';
import { listBranches } from '../services/bitbucket/branches';
import {
  assertPullRequestQuery,
  filterByDestinationBranch,
  listPullRequests
} from '../services/bitbucket/pullRequests';
import { assertAppAdmin } from '../services/config/admins';
import { requireMappedRepo } from '../services/config/mappings';
import { DASHBOARD_WORKSPACE_SLUG, isAllowedRepositoryFullName } from '../services/config/dashboardAllowlist';
import { listRepositories } from '../services/bitbucket/repositories';
import { listWorkspaces } from '../services/bitbucket/workspaces';
import type { PullRequest } from '../models/pullRequest';

export async function getPullRequests(payload: unknown): Promise<Result<PullRequest[]>> {
  try {
    const { workspaceId, repositoryId, prStatus } = assertPullRequestQuery(payload);
    const mapping = await requireMappedRepo(workspaceId, repositoryId);
    const data = filterByDestinationBranch(
      await listPullRequests(workspaceId, repositoryId, prStatus, undefined, mapping.targetBranch, true),
      mapping.targetBranch ?? ''
    );
    console.log(`getPullRequests -> ${data.length} pull requests`);
    return { ok: true, data };
  } catch (error) {
    console.error('getPullRequests failed', error);
    return toFailureResult(error);
  }
}

export async function getPullRequestTargetBranches(payload: unknown): Promise<Result<string[]>> {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const workspaceId = typeof record.workspaceId === 'string' ? record.workspaceId : '';
  const repositoryIds = Array.isArray(record.repositoryIds)
    ? record.repositoryIds.filter((id): id is string => typeof id === 'string')
    : [];
  try {
    await assertAppAdmin();
    const workspace = (await listWorkspaces()).find(
      (item) => item.id === workspaceId && item.slug.toLowerCase() === DASHBOARD_WORKSPACE_SLUG
    );
    if (!workspace) {
      throw new BitbucketApiError('Select the approved Bitbucket workspace.', 403, false);
    }
    if (repositoryIds.length === 0) {
      throw new BitbucketApiError('Select at least one Bitbucket repository.', 400, false);
    }

    const approvedRepositories = (await listRepositories(workspace.id)).filter((repo) =>
      isAllowedRepositoryFullName(repo.fullName)
    );
    const selected = [];
    for (const id of repositoryIds) {
      const repository = approvedRepositories.find((repo) => repo.id === id);
      if (!repository) {
        throw new BitbucketApiError('Select only approved Bitbucket repositories.', 403, false);
      }
      selected.push(repository);
    }

    const branches = new Set<string>();
    const repositoryBranches = await Promise.all(
      selected.map((repository) => listBranches(workspace.id, repository.id))
    );
    for (const repositoryBranchList of repositoryBranches) {
      for (const branch of repositoryBranchList) {
        branches.add(branch);
      }
    }
    return { ok: true, data: Array.from(branches).sort((a, b) => a.localeCompare(b)) };
  } catch (error) {
    return toFailureResult(error);
  }
}
