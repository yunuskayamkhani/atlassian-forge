import type { Repository } from '../../models/repository';
import { createForgeClient, type BitbucketClient } from './client';
import { assertRepositoryId, assertWorkspaceId } from './identifiers';
import { BitbucketApiError } from './errors';
import { collectPages, parsePage } from './pagination';

function hrefFromLinks(raw: unknown, key: string): string {
  if (!raw || typeof raw !== 'object') {
    return '';
  }

  const links = raw as Record<string, unknown>;
  const entry = links[key];
  if (!entry || typeof entry !== 'object') {
    return '';
  }

  const href = (entry as Record<string, unknown>).href;
  return typeof href === 'string' ? href : '';
}

export function normalizeRepository(raw: unknown, workspaceId: string): Repository | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const id = typeof record.uuid === 'string' ? record.uuid : null;
  const name = typeof record.name === 'string' ? record.name : null;
  const fullName = typeof record.full_name === 'string' ? record.full_name : name;

  if (!id || !name || !fullName) {
    return null;
  }

  const main = record.mainbranch && typeof record.mainbranch === 'object' ? (record.mainbranch as Record<string, unknown>) : null;
  const mainBranch = main && typeof main.name === 'string' ? main.name : undefined;

  return {
    id,
    name,
    fullName,
    workspace: workspaceId,
    mainBranch,
    webUrl: hrefFromLinks(record.links, 'html')
  };
}

export async function listRepositories(
  workspaceId: string,
  client?: BitbucketClient
): Promise<Repository[]> {
  const id = assertWorkspaceId(workspaceId);
  const bb = client ?? (await createForgeClient());

  return collectPages({
    fetchFirst: async () =>
      parsePage(await bb.getRelative(`/2.0/repositories/${encodeURIComponent(id)}?pagelen=50`), (raw) =>
        normalizeRepository(raw, id)
      ),
    fetchNext: async (nextUrl) => parsePage(await bb.getAbsolute(nextUrl), (raw) => normalizeRepository(raw, id))
  });
}

export async function getRepository(
  workspaceId: string,
  repositoryId: string,
  client?: BitbucketClient
): Promise<Repository> {
  const id = assertWorkspaceId(workspaceId);
  const repoId = assertRepositoryId(repositoryId);
  const bb = client ?? (await createForgeClient());
  const payload = await bb.getRelative(`/2.0/repositories/${encodeURIComponent(id)}/${encodeURIComponent(repoId)}`);
  const repository = normalizeRepository(payload, id);

  if (!repository) {
    throw new BitbucketApiError('Bitbucket returned a malformed response.', 502, false);
  }

  return repository;
}
