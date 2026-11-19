import type { Deployment } from '../../models/deployment';
import { createForgeClient, type BitbucketClient } from './client';
import { assertRepositoryId, assertWorkspaceId } from './identifiers';
import { BitbucketApiError } from './errors';
import { collectPages, parsePage } from './pagination';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function htmlHref(value: unknown): string {
  const links = asRecord(value);
  const html = links ? asRecord(links.html) : null;
  return html ? stringValue(html.href) : '';
}

export function normalizeDeployment(raw: unknown): Deployment | null {
  const record = asRecord(raw);
  const uuid = record ? stringValue(record.uuid) : '';
  if (!record || !uuid) {
    return null;
  }

  const state = asRecord(record.state);
  const result = state ? asRecord(state.result) : null;
  const environment = asRecord(record.environment);
  const release = asRecord(record.release);
  const commit = release ? asRecord(release.commit) : null;

  return {
    uuid,
    environment: environment ? stringValue(environment.name) : '',
    status:
      (state && stringValue(state.name)) ||
      (state && stringValue(state.status)) ||
      (result && stringValue(result.name)) ||
      'UNKNOWN',
    commitHash: commit ? stringValue(commit.hash) : '',
    createdOn:
      (state && stringValue(state.completed_on)) ||
      (state && stringValue(state.deployed_on)) ||
      (release && stringValue(release.created_on)) ||
      stringValue(record.created_on),
    webUrl:
      (state && stringValue(state.url)) ||
      (release && stringValue(release.url)) ||
      htmlHref(record.links)
  };
}

export async function listDeployments(
  workspaceId: string,
  repositoryId: string,
  client?: BitbucketClient
): Promise<Deployment[]> {
  const workspace = assertWorkspaceId(workspaceId);
  const repository = assertRepositoryId(repositoryId);
  const bb = client ?? (await createForgeClient());
  const base = `/2.0/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(
    repository
  )}/deployments?pagelen=50`;

  return collectPages({
    fetchFirst: async () => parsePage(await bb.getRelative(base), normalizeDeployment),
    fetchNext: async (nextUrl) => parsePage(await bb.getAbsolute(nextUrl), normalizeDeployment)
  });
}

export function assertDeploymentQuery(payload: unknown): {
  workspaceId: string;
  repositoryId: string;
} {
  const record = asRecord(payload);
  if (!record || typeof record.workspaceId !== 'string' || typeof record.repositoryId !== 'string') {
    throw new BitbucketApiError('Select a workspace and repository.', 400, false);
  }

  return {
    workspaceId: record.workspaceId,
    repositoryId: record.repositoryId
  };
}
