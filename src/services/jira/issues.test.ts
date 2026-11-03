import { describe, expect, it } from 'vitest';
import {
  buildStatusJql,
  fetchIssueStatuses,
  parseStatuses,
  validKeys,
  type JiraSearch
} from './issues';
import { BitbucketApiError } from '../bitbucket/errors';

describe('validKeys', () => {
  it('keeps only valid, unique Jira keys', () => {
    expect(validKeys(['SCRUM-1', 'SCRUM-1', 'bad', 'ABC-42', 5])).toEqual(['SCRUM-1', 'ABC-42']);
  });

  it('returns an empty array for non-arrays', () => {
    expect(validKeys('SCRUM-1')).toEqual([]);
  });
});

describe('buildStatusJql', () => {
  it('builds a key in (...) clause', () => {
    expect(buildStatusJql(['SCRUM-1', 'SCRUM-2'])).toBe('key in (SCRUM-1,SCRUM-2)');
  });
});

describe('parseStatuses', () => {
  it('maps issue keys to status name and category', () => {
    const payload = {
      issues: [
        {
          key: 'SCRUM-1',
          fields: { status: { name: 'In Review', statusCategory: { key: 'indeterminate' } } }
        },
        {
          key: 'SCRUM-2',
          fields: { status: { name: 'Done', statusCategory: { key: 'done' } } }
        }
      ]
    };

    expect(parseStatuses(payload)).toEqual({
      'SCRUM-1': { name: 'In Review', category: 'indeterminate' },
      'SCRUM-2': { name: 'Done', category: 'done' }
    });
  });

  it('returns an empty object for malformed payloads', () => {
    expect(parseStatuses(null)).toEqual({});
    expect(parseStatuses({})).toEqual({});
  });
});

describe('fetchIssueStatuses', () => {
  it('returns an empty map without calling Jira when there are no valid keys', async () => {
    let called = false;
    const search: JiraSearch = async () => {
      called = true;
      return { ok: true, status: 200, json: async () => ({ issues: [] }) };
    };

    expect(await fetchIssueStatuses(['nope'], search)).toEqual({});
    expect(called).toBe(false);
  });

  it('sends a JQL search and parses the response', async () => {
    let sentBody = '';
    const search: JiraSearch = async (body) => {
      sentBody = body;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          issues: [{ key: 'SCRUM-1', fields: { status: { name: 'To Do', statusCategory: { key: 'new' } } } }]
        })
      };
    };

    const result = await fetchIssueStatuses(['SCRUM-1'], search);

    expect(JSON.parse(sentBody).jql).toBe('key in (SCRUM-1)');
    expect(result).toEqual({ 'SCRUM-1': { name: 'To Do', category: 'new' } });
  });

  it('throws a structured error on failure', async () => {
    const search: JiraSearch = async () => ({ ok: false, status: 403, json: async () => ({}) });

    await expect(fetchIssueStatuses(['SCRUM-1'], search)).rejects.toBeInstanceOf(BitbucketApiError);
  });
});
