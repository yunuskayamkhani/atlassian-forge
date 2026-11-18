import { createForgeClient, type BitbucketClient } from './client';
import { assertRepositoryId, assertWorkspaceId } from './identifiers';
import { collectPages, parsePage } from './pagination';

export function normalizeBranch(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const name = (raw as Record<string, unknown>).name;
  return typeof name === 'string' && name.trim() ? name : null;
}

export async function listBranches(
  workspaceId: string,
  repositoryId: string,
  client?: BitbucketClient
): Promise<string[]> {
  const workspace = assertWorkspaceId(workspaceId);
  const repository = assertRepositoryId(repositoryId);
  const bb = client ?? (await createForgeClient());
  const base = `/2.0/repositories/${encodeURIComponent(workspace)}/${encodeURIComponent(
    repository
  )}/refs/branches?pagelen=100&sort=name`;

  return collectPages({
    fetchFirst: async () => parsePage(await bb.getRelative(base), normalizeBranch),
    fetchNext: async (nextUrl) => parsePage(await bb.getAbsolute(nextUrl), normalizeBranch)
  });
}
