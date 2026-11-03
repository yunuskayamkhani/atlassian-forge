import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { assertCommitQuery, listCommits } from '../services/bitbucket/commits';
import { requireMappedRepo } from '../services/config/mappings';
import { commitSprintKeys, filterForClientSprint } from '../services/jira/sprintFilter';
import type { Commit } from '../models/commit';

export async function getCommits(payload: unknown): Promise<Result<Commit[]>> {
  try {
    const { workspaceId, repositoryId } = assertCommitQuery(payload);
    const mapping = await requireMappedRepo(workspaceId, repositoryId);
    const data = await filterForClientSprint(
      mapping,
      await listCommits(workspaceId, repositoryId),
      commitSprintKeys
    );
    console.log(`getCommits -> ${data.length} commits`);
    return { ok: true, data };
  } catch (error) {
    console.error('getCommits failed', error);
    return toFailureResult(error);
  }
}
