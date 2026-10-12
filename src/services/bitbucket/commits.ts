import type { Commit } from '../../models/commit';
import { createForgeClient, type BitbucketClient } from './client';
import { assertRepositoryId, assertWorkspaceId } from './identifiers';
import { BitbucketApiError } from './errors';
import { collectPages, parsePage } from './pagination';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function htmlHref(links: unknown): string {
  const record = asRecord(links);
  const html = record ? asRecord(record.html) : null;
  return html && typeof html.href === 'string' ? html.href : '';
}

export function commitAuthor(raw: unknown): string {
  const author = asRecord(raw);
  if (!author) {
    return 'Unknown';
  }

  const user = asRecord(author.user);
  if (user) {
    if (typeof user.display_name === 'string' && user.display_name.trim()) {
      return user.display_name;
    }
    if (typeof user.nickname === 'string' && user.nickname.trim()) {
      return user.nickname;
    }
  }

  if (typeof author.raw === 'string' && author.raw.trim()) {
    const angle = author.raw.indexOf('<');
    const name = angle >= 0 ? author.raw.slice(0, angle) : author.raw;
    return name.trim() || author.raw.trim();
  }

  return 'Unknown';
}

export function firstLine(message: string): string {
  const line = message.split('\n', 1)[0];
  return line.trim();
}

export function normalizeCommit(raw: unknown): Commit | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const hash = typeof record.hash === 'string' ? record.hash : null;
  if (!hash) {
    return null;
  }

  const message = typeof record.message === 'string' ? firstLine(record.message) : '';

  return {
    hash,
    shortHash: hash.slice(0, 7),
    message,
    author: commitAuthor(record.author),
    date: typeof record.date === 'string' ? record.date : '',
    webUrl: htmlHref(record.links)
  };
}

export async function listCommits(
  workspaceId: string,
  repositoryId: string,
  client?: BitbucketClient
): Promise<Commit[]> {
  const ws = assertWorkspaceId(workspaceId);
  const repo = assertRepositoryId(repositoryId);
  const bb = client ?? (await createForgeClient());

  const base = `/2.0/repositories/${encodeURIComponent(ws)}/${encodeURIComponent(repo)}/commits?pagelen=50`;

  return collectPages({
    fetchFirst: async () => parsePage(await bb.getRelative(base), normalizeCommit),
    fetchNext: async (nextUrl) => parsePage(await bb.getAbsolute(nextUrl), normalizeCommit)
  });
}

export function assertCommitQuery(payload: unknown): { workspaceId: string; repositoryId: string } {
  const record = asRecord(payload);
  if (!record) {
    throw new BitbucketApiError('Select a workspace and repository.', 400, false);
  }

  return {
    workspaceId: record.workspaceId as string,
    repositoryId: record.repositoryId as string
  };
}
