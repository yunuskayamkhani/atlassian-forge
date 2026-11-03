import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { assertPullRequestQuery, listPullRequests } from '../services/bitbucket/pullRequests';
import { requireMappedRepo } from '../services/config/mappings';
import { filterForClientSprint, pullRequestSprintKeys } from '../services/jira/sprintFilter';
import type { PullRequest } from '../models/pullRequest';

export async function getPullRequests(payload: unknown): Promise<Result<PullRequest[]>> {
  try {
    const { workspaceId, repositoryId, prStatus } = assertPullRequestQuery(payload);
    const mapping = await requireMappedRepo(workspaceId, repositoryId);
    const data = await filterForClientSprint(
      mapping,
      await listPullRequests(workspaceId, repositoryId, prStatus),
      pullRequestSprintKeys
    );
    console.log(`getPullRequests -> ${data.length} pull requests`);
    return { ok: true, data };
  } catch (error) {
    console.error('getPullRequests failed', error);
    return toFailureResult(error);
  }
}
