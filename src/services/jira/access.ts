import { BitbucketApiError } from '../bitbucket/errors';
import { loadForgeJira, type JiraResponse } from './client';

export type JiraProject = {
  id: string;
  key: string;
  name: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function parseIsAdmin(payload: unknown): boolean {
  const permissions = asRecord(asRecord(payload)?.permissions);
  const administer = permissions ? asRecord(permissions.ADMINISTER) : null;
  return administer?.havePermission === true;
}

export function parseProjectPage(payload: unknown): { projects: JiraProject[]; isLast: boolean; nextStart: number } {
  const record = asRecord(payload);
  const values = record && Array.isArray(record.values) ? record.values : [];
  const startAt = typeof record?.startAt === 'number' ? record.startAt : 0;
  const maxResults = typeof record?.maxResults === 'number' ? record.maxResults : values.length;
  const isLast = record?.isLast === true || values.length === 0;

  const projects = values
    .map((raw) => {
      const item = asRecord(raw);
      if (!item) {
        return null;
      }
      const id = item.id === undefined || item.id === null ? '' : String(item.id);
      const key = typeof item.key === 'string' ? item.key : '';
      const name = typeof item.name === 'string' ? item.name : key;
      if (!id || !key) {
        return null;
      }
      return { id, key, name };
    })
    .filter((project): project is JiraProject => project !== null);

  return { projects, isLast, nextStart: startAt + maxResults };
}

export type JiraGet = (path: string) => Promise<JiraResponse>;

async function defaultJiraGet(): Promise<JiraGet> {
  const { api, route } = await loadForgeJira();
  return async (path: string) => {
    if (path.startsWith('/rest/api/3/mypermissions')) {
      return api.asUser().requestJira(route`/rest/api/3/mypermissions?permissions=ADMINISTER`);
    }
    const match = /startAt=(\d+)/.exec(path);
    const startAt = match ? Number(match[1]) : 0;
    return api.asUser().requestJira(route`/rest/api/3/project/search?maxResults=50&startAt=${startAt}`);
  };
}

export async function isJiraAdmin(get?: JiraGet): Promise<boolean> {
  const request = get ?? (await defaultJiraGet());
  const res = await request('/rest/api/3/mypermissions?permissions=ADMINISTER');
  if (!res.ok) {
    console.error(`Jira mypermissions failed: ${res.status}`);
    return false;
  }
  return parseIsAdmin(await res.json());
}

export async function assertJiraAdmin(): Promise<void> {
  if (!(await isJiraAdmin())) {
    throw new BitbucketApiError('Only a Jira administrator can do that.', 403, false);
  }
}

export async function listBrowsableProjects(get?: JiraGet): Promise<JiraProject[]> {
  const request = get ?? (await defaultJiraGet());
  const projects: JiraProject[] = [];
  let startAt = 0;

  for (let page = 0; page < 10; page += 1) {
    const res = await request(`/rest/api/3/project/search?maxResults=50&startAt=${startAt}`);
    if (!res.ok) {
      throw new BitbucketApiError(`Could not load Jira projects (${res.status}).`, res.status, res.status >= 500);
    }
    const parsed = parseProjectPage(await res.json());
    projects.push(...parsed.projects);
    if (parsed.isLast) {
      break;
    }
    startAt = parsed.nextStart;
  }

  return projects;
}

export function browsableIdSet(projects: JiraProject[]): Set<string> {
  const ids = new Set<string>();
  for (const project of projects) {
    ids.add(project.id);
    ids.add(project.key);
  }
  return ids;
}
