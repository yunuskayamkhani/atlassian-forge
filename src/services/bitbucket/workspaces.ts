import type { Workspace } from '../../models/workspace';
import { createForgeClient, type BitbucketClient } from './client';
import { collectPages, parsePage } from './pagination';

export function normalizeWorkspace(raw: unknown): Workspace | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const source =
    record.workspace && typeof record.workspace === 'object'
      ? (record.workspace as Record<string, unknown>)
      : record;
  const id = typeof source.uuid === 'string' ? source.uuid : null;
  const slug = typeof source.slug === 'string' ? source.slug : null;

  if (!id || !slug) {
    return null;
  }

  const name = typeof source.name === 'string' && source.name.trim() ? source.name : slug;

  return { id, slug, name };
}

export async function listWorkspaces(client?: BitbucketClient): Promise<Workspace[]> {
  const bb = client ?? (await createForgeClient());

  return collectPages({
    fetchFirst: async () => parsePage(await bb.getRelative('/2.0/user/workspaces?pagelen=50'), normalizeWorkspace),
    fetchNext: async (nextUrl) => parsePage(await bb.getAbsolute(nextUrl), normalizeWorkspace)
  });
}
