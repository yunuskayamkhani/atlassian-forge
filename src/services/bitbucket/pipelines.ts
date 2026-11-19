import type { PipelineRun } from '../../models/pipeline';
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

export function normalizePipelineRun(raw: unknown): PipelineRun | null {
  const record = asRecord(raw);
  const uuid = record ? stringValue(record.uuid) : '';
  if (!record || !uuid) {
    return null;
  }

  const state = asRecord(record.state);
  const result = state ? asRecord(state.result) : null;
  const stage = state ? asRecord(state.stage) : null;
  const target = asRecord(record.target);
  const commit = target ? asRecord(target.commit) : null;
  const trigger = asRecord(record.trigger);
  const status =
    (result && stringValue(result.name)) ||
    (state && stringValue(state.name)) ||
    (stage && stringValue(stage.name)) ||
    'UNKNOWN';

  return {
    uuid,
    buildNumber: typeof record.build_number === 'number' ? record.build_number : null,
    status,
    branch: target ? stringValue(target.ref_name) : '',
    commitHash: commit ? stringValue(commit.hash) : '',
    trigger: trigger ? stringValue(trigger.name) || stringValue(trigger.type) : '',
    createdOn: stringValue(record.created_on),
    completedOn: stringValue(record.completed_on),
    buildSeconds: typeof record.build_seconds_used === 'number' ? record.build_seconds_used : null,
    webUrl: htmlHref(record.links)
  };
}

export async function listPipelineRuns(
  workspaceId: string,
  repositoryId: string,
  client?: BitbucketClient
): Promise<PipelineRun[]> {
  const workspace = assertWorkspaceId(workspaceId);
  const repository = assertRepositoryId(repositoryId);
  const bb = client ?? (await createForgeClient());
  const base = `/2.0/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(
    repository
  )}/pipelines?pagelen=50&sort=-created_on`;

  return collectPages({
    fetchFirst: async () => parsePage(await bb.getRelative(base), normalizePipelineRun),
    fetchNext: async (nextUrl) => parsePage(await bb.getAbsolute(nextUrl), normalizePipelineRun)
  });
}

export function assertPipelineQuery(payload: unknown): {
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
