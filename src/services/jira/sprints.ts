import { BitbucketApiError } from '../bitbucket/errors';
import { loadForgeJira, type JiraResponse } from './client';

export type JiraBoard = {
  id: string;
  name: string;
  type: string;
};

export type JiraSprint = {
  id: string;
  name: string;
  state: string;
};

export type AgileGet = (kind: 'boards' | 'sprints' | 'issues', id: string, startAt: number) => Promise<JiraResponse>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pageIsLast(record: Record<string, unknown>, count: number): boolean {
  if (record.isLast === true) {
    return true;
  }
  const startAt = typeof record.startAt === 'number' ? record.startAt : 0;
  const total = typeof record.total === 'number' ? record.total : startAt + count;
  return startAt + count >= total || count === 0;
}

export function parseBoards(payload: unknown): { items: JiraBoard[]; isLast: boolean } {
  const record = asRecord(payload);
  const values = record && Array.isArray(record.values) ? record.values : [];
  const items = values
    .map((raw) => {
      const item = asRecord(raw);
      const id = item?.id === undefined || item.id === null ? '' : String(item.id);
      const name = typeof item?.name === 'string' ? item.name : '';
      const type = typeof item?.type === 'string' ? item.type : '';
      if (!id || !name) {
        return null;
      }
      return { id, name, type };
    })
    .filter((board): board is JiraBoard => board !== null);

  return { items, isLast: pageIsLast(record ?? {}, items.length) };
}

export function parseSprints(payload: unknown): { items: JiraSprint[]; isLast: boolean } {
  const record = asRecord(payload);
  const values = record && Array.isArray(record.values) ? record.values : [];
  const items = values
    .map((raw) => {
      const item = asRecord(raw);
      const id = item?.id === undefined || item.id === null ? '' : String(item.id);
      const name = typeof item?.name === 'string' ? item.name : '';
      const state = typeof item?.state === 'string' ? item.state.toLowerCase() : '';
      if (!id || !name) {
        return null;
      }
      return { id, name, state };
    })
    .filter((sprint): sprint is JiraSprint => sprint !== null);

  return { items, isLast: pageIsLast(record ?? {}, items.length) };
}

export function parseSprintIssueKeys(payload: unknown): { keys: string[]; isLast: boolean; nextStart: number } {
  const record = asRecord(payload);
  const issues = record && Array.isArray(record.issues) ? record.issues : [];
  const startAt = typeof record?.startAt === 'number' ? record.startAt : 0;
  const keys = issues
    .map((raw) => {
      const item = asRecord(raw);
      return typeof item?.key === 'string' ? item.key : '';
    })
    .filter((key) => key.length > 0);

  return {
    keys,
    isLast: pageIsLast(record ?? {}, issues.length),
    nextStart: startAt + issues.length
  };
}

async function defaultAgileGet(): Promise<AgileGet> {
  const { api, route } = await loadForgeJira();
  return async (kind, id, startAt) => {
    if (kind === 'boards') {
      return api.asUser().requestJira(
        route`/rest/agile/1.0/board?projectKeyOrId=${id}&maxResults=50&startAt=${startAt}`
      );
    }
    if (kind === 'sprints') {
      const boardId = Number(id);
      if (!Number.isFinite(boardId)) {
        throw new BitbucketApiError('Invalid Jira board.', 400, false);
      }
      return api.asUser().requestJira(
        route`/rest/agile/1.0/board/${boardId}/sprint?state=active,future,closed&maxResults=50&startAt=${startAt}`
      );
    }
    const sprintId = Number(id);
    if (!Number.isFinite(sprintId)) {
      throw new BitbucketApiError('Invalid Jira sprint.', 400, false);
    }
    return api.asUser().requestJira(
      route`/rest/agile/1.0/sprint/${sprintId}/issue?fields=key&maxResults=50&startAt=${startAt}`
    );
  };
}

async function collectPages<T>(
  fetchPage: (startAt: number) => Promise<{ items: T[]; isLast: boolean; nextStart?: number }>,
  take: (page: { items: T[]; isLast: boolean; nextStart?: number }) => T[]
): Promise<T[]> {
  const items: T[] = [];
  let startAt = 0;
  for (let page = 0; page < 10; page += 1) {
    const result = await fetchPage(startAt);
    items.push(...take(result));
    if (result.isLast) {
      break;
    }
    startAt = result.nextStart ?? startAt + 50;
  }
  return items;
}

export async function listBoards(projectKey: string, get?: AgileGet): Promise<JiraBoard[]> {
  const key = projectKey.trim();
  if (!key) {
    throw new BitbucketApiError('Select a Jira project.', 400, false);
  }
  const request = get ?? (await defaultAgileGet());
  return collectPages(async (startAt) => {
    const res = await request('boards', key, startAt);
    if (!res.ok) {
      throw new BitbucketApiError(`Could not load Jira boards (${res.status}).`, res.status, res.status >= 500);
    }
    const parsed = parseBoards(await res.json());
    return { ...parsed, nextStart: startAt + 50 };
  }, (page) => page.items);
}

export async function listSprints(boardId: string, get?: AgileGet): Promise<JiraSprint[]> {
  const request = get ?? (await defaultAgileGet());
  const sprints = await collectPages(async (startAt) => {
    const res = await request('sprints', boardId, startAt);
    if (!res.ok) {
      throw new BitbucketApiError(`Could not load Jira sprints (${res.status}).`, res.status, res.status >= 500);
    }
    const parsed = parseSprints(await res.json());
    return { ...parsed, nextStart: startAt + 50 };
  }, (page) => page.items);

  const rank = (state: string) => (state === 'active' ? 0 : state === 'future' ? 1 : 2);
  return sprints.sort((a, b) => rank(a.state) - rank(b.state) || a.name.localeCompare(b.name));
}

export async function listSprintIssueKeys(sprintId: string, get?: AgileGet): Promise<string[]> {
  const request = get ?? (await defaultAgileGet());
  return collectPages(async (startAt) => {
    const res = await request('issues', sprintId, startAt);
    if (!res.ok) {
      throw new BitbucketApiError(`Could not load sprint issues (${res.status}).`, res.status, res.status >= 500);
    }
    const parsed = parseSprintIssueKeys(await res.json());
    return { items: parsed.keys, isLast: parsed.isLast, nextStart: parsed.nextStart };
  }, (page) => page.items);
}

export async function resolveClientSprint(
  mapping: { sprintMode: string; boardId: string; sprintId: string; sprintName: string },
  get?: AgileGet
): Promise<{ sprintId: string; sprintName: string; keys: Set<string> } | null> {
  if (mapping.sprintMode === 'none' || !mapping.sprintMode) {
    return null;
  }

  let sprintId = mapping.sprintId;
  let sprintName = mapping.sprintName;

  if (mapping.sprintMode === 'active') {
    if (!mapping.boardId) {
      throw new BitbucketApiError('Select a Jira board to use the active sprint.', 400, false);
    }
    const sprints = await listSprints(mapping.boardId, get);
    const active = sprints.filter((sprint) => sprint.state === 'active');
    if (active.length === 0) {
      return { sprintId: '', sprintName: 'No active sprint', keys: new Set() };
    }
    const chosen =
      active.find((sprint) => sprint.id === mapping.sprintId) ?? (active.length === 1 ? active[0] : null);
    if (!chosen) {
      throw new BitbucketApiError(
        'This board has more than one active sprint. In Project access, pick the sprint the client should see.',
        400,
        false
      );
    }
    sprintId = chosen.id;
    sprintName = chosen.name;
  }

  if (!sprintId) {
    throw new BitbucketApiError('Select the sprint the client should see.', 400, false);
  }

  const keys = new Set(await listSprintIssueKeys(sprintId, get));
  return { sprintId, sprintName, keys };
}
