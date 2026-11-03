import { BitbucketApiError } from '../bitbucket/errors';
import { loadForgeJira } from './client';

export type JiraStatus = {
  name: string;
  category: string;
};

const JIRA_KEY = /^[A-Z][A-Z0-9]+-\d+$/;
const MAX_KEYS = 100;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function validKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) {
    return [];
  }

  const unique = new Set<string>();
  for (const key of keys) {
    if (typeof key === 'string' && JIRA_KEY.test(key)) {
      unique.add(key);
    }
  }

  return Array.from(unique).slice(0, MAX_KEYS);
}

export function buildStatusJql(keys: string[]): string {
  return `key in (${keys.join(',')})`;
}

export function parseStatuses(payload: unknown): Record<string, JiraStatus> {
  const out: Record<string, JiraStatus> = {};
  const record = asRecord(payload);
  if (!record || !Array.isArray(record.issues)) {
    return out;
  }

  for (const issue of record.issues) {
    const issueRecord = asRecord(issue);
    const key = issueRecord && typeof issueRecord.key === 'string' ? issueRecord.key : null;
    if (!key) {
      continue;
    }

    const fields = issueRecord ? asRecord(issueRecord.fields) : null;
    const status = fields ? asRecord(fields.status) : null;
    const name = status && typeof status.name === 'string' ? status.name : 'Unknown';
    const categoryRecord = status ? asRecord(status.statusCategory) : null;
    const category =
      categoryRecord && typeof categoryRecord.key === 'string' ? categoryRecord.key : 'new';

    out[key] = { name, category };
  }

  return out;
}

export type JiraSearchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

export type JiraSearch = (body: string) => Promise<JiraSearchResponse>;

async function defaultSearch(): Promise<JiraSearch> {
  const { api, route } = await loadForgeJira();

  return (body: string) =>
    api.asUser().requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body
    });
}

export async function fetchIssueStatuses(
  keys: unknown,
  search?: JiraSearch
): Promise<Record<string, JiraStatus>> {
  const valid = validKeys(keys);
  if (valid.length === 0) {
    return {};
  }

  const send = search ?? (await defaultSearch());
  const body = JSON.stringify({
    jql: buildStatusJql(valid),
    fields: ['status'],
    maxResults: valid.length
  });

  const res = await send(body);
  if (!res.ok) {
    console.error(`Jira status search failed: ${res.status}`);
    throw new BitbucketApiError(
      `Could not load Jira statuses (${res.status}).`,
      res.status,
      res.status >= 500 || res.status === 429
    );
  }

  return parseStatuses(await res.json());
}
