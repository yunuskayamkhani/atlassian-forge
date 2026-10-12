import type { Commit } from '../../models/commit';
import type { ProjectMapping } from '../../models/projectMapping';
import type { PullRequest } from '../../models/pullRequest';
import { extractJiraKeys, itemMatchesSprint } from './keys';
import { resolveClientSprint } from './sprints';

export async function filterForClientSprint<T>(
  mapping: ProjectMapping,
  items: T[],
  keysOf: (item: T) => string[]
): Promise<T[]> {
  const sprint = await resolveClientSprint(mapping);
  if (!sprint) {
    return items;
  }
  return items.filter((item) => itemMatchesSprint(keysOf(item), sprint.keys));
}

export function pullRequestSprintKeys(pr: PullRequest): string[] {
  return pr.jiraKeys;
}

export function commitSprintKeys(commit: Commit): string[] {
  return extractJiraKeys(commit.message);
}
