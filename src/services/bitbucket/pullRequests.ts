import type { PullRequest, PullRequestState } from '../../models/pullRequest';
import { createForgeClient, type BitbucketClient } from './client';
import { assertRepositoryId, assertWorkspaceId } from './identifiers';
import { BitbucketApiError } from './errors';
import { collectPages, parsePage } from './pagination';

import { extractJiraKeys } from '../jira/keys';

export { extractJiraKeys };

const PR_STATES: PullRequestState[] = ['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED'];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function branchName(value: unknown): string {
  const source = asRecord(value);
  const branch = source ? asRecord(source.branch) : null;
  return branch && typeof branch.name === 'string' ? branch.name : '';
}

function personName(value: unknown): string {
  const record = asRecord(value);
  if (!record) {
    return '';
  }
  if (typeof record.display_name === 'string') {
    return record.display_name;
  }
  return typeof record.nickname === 'string' ? record.nickname : '';
}

function reviewerNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(personName).filter((name): name is string => name.length > 0);
}

function htmlHref(links: unknown): string {
  const record = asRecord(links);
  const html = record ? asRecord(record.html) : null;
  return html && typeof html.href === 'string' ? html.href : '';
}

function normalizeState(value: unknown): PullRequestState {
  return PR_STATES.includes(value as PullRequestState) ? (value as PullRequestState) : 'OPEN';
}

export function normalizePullRequest(raw: unknown): PullRequest | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id =
    typeof record.id === 'number'
      ? String(record.id)
      : typeof record.id === 'string'
        ? record.id
        : null;
  const title = typeof record.title === 'string' ? record.title : null;

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    state: normalizeState(record.state),
    author: personName(record.author),
    sourceBranch: branchName(record.source),
    targetBranch: branchName(record.destination),
    createdOn: typeof record.created_on === 'string' ? record.created_on : '',
    updatedOn: typeof record.updated_on === 'string' ? record.updated_on : '',
    webUrl: htmlHref(record.links),
    reviewers: reviewerNames(record.reviewers),
    jiraKeys: extractJiraKeys(title)
  };
}

export function statesForFilter(prStatus?: string): PullRequestState[] {
  if (prStatus && PR_STATES.includes(prStatus as PullRequestState)) {
    return [prStatus as PullRequestState];
  }
  return PR_STATES;
}

export async function listPullRequests(
  workspaceId: string,
  repositoryId: string,
  prStatus?: string,
  client?: BitbucketClient
): Promise<PullRequest[]> {
  const ws = assertWorkspaceId(workspaceId);
  const repo = assertRepositoryId(repositoryId);
  const bb = client ?? (await createForgeClient());

  const query = statesForFilter(prStatus)
    .map((state) => `state=${state}`)
    .join('&');
  const base = `/2.0/repositories/${encodeURIComponent(ws)}/${encodeURIComponent(
    repo
  )}/pullrequests?${query}&pagelen=50&sort=-updated_on`;

  return collectPages({
    fetchFirst: async () => parsePage(await bb.getRelative(base), normalizePullRequest),
    fetchNext: async (nextUrl) => parsePage(await bb.getAbsolute(nextUrl), normalizePullRequest)
  });
}

export function assertPullRequestQuery(payload: unknown): {
  workspaceId: string;
  repositoryId: string;
  prStatus?: string;
} {
  const record = asRecord(payload);
  if (!record) {
    throw new BitbucketApiError('Select a workspace and repository.', 400, false);
  }

  return {
    workspaceId: record.workspaceId as string,
    repositoryId: record.repositoryId as string,
    prStatus: typeof record.prStatus === 'string' ? record.prStatus : undefined
  };
}
