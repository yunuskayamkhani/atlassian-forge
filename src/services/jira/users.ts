import { BitbucketApiError } from '../bitbucket/errors';
import type { AppUser } from '../../models/appUser';
import { loadForgeJira, type JiraResponse } from './client';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function parseUser(raw: unknown): AppUser | null {
  const record = asRecord(raw);
  const accountId = typeof record?.accountId === 'string' ? record.accountId : '';
  const displayName = typeof record?.displayName === 'string' ? record.displayName : '';
  if (!accountId) {
    return null;
  }
  return { accountId, displayName: displayName || accountId };
}

export function parseUserList(payload: unknown): AppUser[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const users: AppUser[] = [];
  const seen = new Set<string>();
  for (const raw of payload) {
    const user = parseUser(raw);
    if (!user || seen.has(user.accountId)) {
      continue;
    }
    seen.add(user.accountId);
    users.push(user);
  }
  return users;
}

export type JiraUserGet = (kind: 'myself' | 'search', query?: string) => Promise<JiraResponse>;

async function defaultUserGet(): Promise<JiraUserGet> {
  const { api, route } = await loadForgeJira();
  return async (kind, query = '') => {
    if (kind === 'myself') {
      return api.asUser().requestJira(route`/rest/api/3/myself`);
    }
    return api.asUser().requestJira(route`/rest/api/3/user/search?query=${query}&maxResults=20`);
  };
}

export async function getCurrentUser(get?: JiraUserGet): Promise<AppUser> {
  const request = get ?? (await defaultUserGet());
  const res = await request('myself');
  if (!res.ok) {
    throw new BitbucketApiError(`Could not load the current Jira user (${res.status}).`, res.status, res.status >= 500);
  }
  const user = parseUser(await res.json());
  if (!user) {
    throw new BitbucketApiError('Could not load the current Jira user.', 502, false);
  }
  return user;
}

export async function searchJiraUsers(query: string, get?: JiraUserGet): Promise<AppUser[]> {
  const term = query.trim();
  if (term.length < 2) {
    return [];
  }
  const request = get ?? (await defaultUserGet());
  const res = await request('search', term);
  if (!res.ok) {
    throw new BitbucketApiError(`Could not search Jira users (${res.status}).`, res.status, res.status >= 500);
  }
  return parseUserList(await res.json());
}
