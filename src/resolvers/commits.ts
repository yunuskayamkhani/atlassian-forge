import { toFailureResult, type Result } from '../services/bitbucket/errors';
import {
  assertCommitQuery,
  listCommits,
  listPullRequestCommits
} from '../services/bitbucket/commits';
import { createForgeClient } from '../services/bitbucket/client';
import {
  filterByDestinationBranch,
  filterByUpdatedSince,
  listPullRequests
} from '../services/bitbucket/pullRequests';
import { mapInBatches } from '../services/bitbucket/pagination';
import { requireMappedRepo } from '../services/config/mappings';
import type { Commit } from '../models/commit';

export async function getCommits(payload: unknown): Promise<Result<Commit[]>> {
  try {
    const { workspaceId, repositoryId, prStatus, dateFrom } = assertCommitQuery(payload);
    const mapping = await requireMappedRepo(workspaceId, repositoryId);
    let data: Commit[];
    if (!mapping.targetBranch) {
      data = await listCommits(workspaceId, repositoryId);
    } else {
      const client = await createForgeClient();
      const pullRequests = filterByUpdatedSince(
        filterByDestinationBranch(
          await listPullRequests(workspaceId, repositoryId, prStatus, client, mapping.targetBranch),
          mapping.targetBranch
        ),
        dateFrom
      );
      const commits = new Map<string, Commit>();
      const pullRequestCommits = await mapInBatches(pullRequests, 2, (pullRequest) =>
        listPullRequestCommits(workspaceId, repositoryId, pullRequest.id, client)
      );
      for (const pullRequestCommitList of pullRequestCommits) {
        for (const commit of pullRequestCommitList) {
          commits.set(commit.hash, commit);
        }
      }
      data = Array.from(commits.values());
    }
    console.log(`getCommits -> ${data.length} commits`);
    return { ok: true, data };
  } catch (error) {
    console.error('getCommits failed', error);
    return toFailureResult(error);
  }
}
