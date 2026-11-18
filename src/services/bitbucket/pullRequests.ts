import type { PullRequest, PullRequestState } from '../../models/pullRequest';
import { createForgeClient, type BitbucketClient } from './client';
import { assertRepositoryId, assertWorkspaceId } from './identifiers';
import { BitbucketApiError } from './errors';
import { collectPages, mapInBatches, parsePage } from './pagination';

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
  const candidates = [record.display_name, record.nickname, record.username, record.name, record.account_id];
  return candidates.find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)?.trim() ?? '';
}

function reviewerNames(value: unknown, participants: unknown): string[] {
  if (!Array.isArray(value)) {
    return reviewerParticipantNames(participants);
  }
  const names = value
    .map((reviewer) => {
      const record = asRecord(reviewer);
      return personName(record?.user ?? reviewer);
    })
    .filter((name): name is string => name.length > 0);
  return names.length > 0 ? names : reviewerParticipantNames(participants);
}

function reviewerParticipantNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((participant) => {
      const record = asRecord(participant);
      return record?.role === 'REVIEWER';
    })
    .map((participant) => {
      const record = asRecord(participant);
      return personName(record?.user);
    })
    .filter((name): name is string => name.length > 0);
}

function approvedReviewerNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((participant) => {
      const record = asRecord(participant);
      return record?.role === 'REVIEWER' && record.approved === true;
    })
    .map((participant) => {
      const record = asRecord(participant);
      return personName(record?.user);
    })
    .filter((name): name is string => name.length > 0);
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
    declinedBy: personName(record.closed_by),
    reviewers: reviewerNames(record.reviewers, record.participants),
    approvedReviewers: approvedReviewerNames(record.participants),
    jiraKeys: extractJiraKeys(
      [title, branchName(record.source), branchName(record.destination), record.description]
        .filter((value): value is string => typeof value === 'string')
        .join('\n')
    )
  };
}

export function statesForFilter(prStatus?: string): PullRequestState[] {
  if (prStatus && PR_STATES.includes(prStatus as PullRequestState)) {
    return [prStatus as PullRequestState];
  }
  return PR_STATES;
}

export function filterByDestinationBranch(
  pullRequests: PullRequest[],
  targetBranch: string
): PullRequest[] {
  return targetBranch ? pullRequests.filter((pullRequest) => pullRequest.targetBranch === targetBranch) : pullRequests;
}

export function filterByUpdatedSince(pullRequests: PullRequest[], from: number | null): PullRequest[] {
  if (from === null) {
    return pullRequests;
  }

  return pullRequests.filter((pullRequest) => {
    const updatedAt = new Date(pullRequest.updatedOn).getTime();
    return !Number.isNaN(updatedAt) && updatedAt >= from;
  });
}

export async function listPullRequests(
  workspaceId: string,
  repositoryId: string,
  prStatus?: string,
  client?: BitbucketClient,
  destinationBranch?: string,
  includeReviewerDetails = false
): Promise<PullRequest[]> {
  const ws = assertWorkspaceId(workspaceId);
  const repo = assertRepositoryId(repositoryId);
  const bb = client ?? (await createForgeClient());
  const reviewerDetailsNeeded = new Set<string>();

  const query = statesForFilter(prStatus)
    .map((state) => `state=${state}`)
    .join('&');
  const branchQuery = destinationBranch
    ? `&q=${encodeURIComponent(`destination.branch.name="${destinationBranch.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)}`
    : '';
  const base = `/2.0/repositories/${encodeURIComponent(ws)}/${encodeURIComponent(
    repo
  )}/pullrequests?${query}${branchQuery}&pagelen=50&sort=-updated_on`;
  const parsePullRequestPage = (payload: unknown) =>
    parsePage(payload, (raw) => {
      const pullRequest = normalizePullRequest(raw);
      const record = asRecord(raw);
      if (includeReviewerDetails && pullRequest && record) {
        const reviewers = record.reviewers;
        const participants = record.participants;
        const hasAssignedReviewers = Array.isArray(reviewers) && reviewers.length > 0;
        const reviewerDataMissing = !Array.isArray(reviewers);
        const approvalStateMissing =
          !Array.isArray(participants) ||
          !participants.some((participant) => typeof asRecord(participant)?.approved === 'boolean');
        if (approvalStateMissing && (hasAssignedReviewers || reviewerDataMissing)) {
          reviewerDetailsNeeded.add(pullRequest.id);
        }
      }
      return pullRequest;
    });

  const pullRequests = await collectPages({
    fetchFirst: async () => parsePullRequestPage(await bb.getRelative(base)),
    fetchNext: async (nextUrl) => parsePullRequestPage(await bb.getAbsolute(nextUrl))
  });
  if (reviewerDetailsNeeded.size === 0) {
    return pullRequests;
  }

  const reviewerDetails = await mapInBatches(Array.from(reviewerDetailsNeeded), 4, async (id) => {
    const detailPath = `/2.0/repositories/${encodeURIComponent(ws)}/${encodeURIComponent(
      repo
    )}/pullrequests/${encodeURIComponent(id)}`;
    const detail = normalizePullRequest(await bb.getRelative(detailPath));
    if (!detail) {
      throw new BitbucketApiError('Bitbucket returned a malformed pull request response.', 502, false);
    }
    return [id, { reviewers: detail.reviewers, approvedReviewers: detail.approvedReviewers }] as const;
  });
  const reviewersByPullRequest = new Map(reviewerDetails);

  return pullRequests.map((pullRequest) => {
    const details = reviewersByPullRequest.get(pullRequest.id);
    return details
      ? {
          ...pullRequest,
          reviewers: details.reviewers,
          approvedReviewers: details.approvedReviewers
        }
      : pullRequest;
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
