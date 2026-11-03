import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import {
  extractJiraKeys,
  listPullRequests,
  normalizePullRequest,
  statesForFilter
} from './pullRequests';

const workspaceId = '{470c176d-3574-44ea-bb41-89e8638bcca4}';
const repoId = '{11111111-1111-1111-1111-111111111111}';

const rawPr = {
  id: 42,
  title: 'PROJ-123 Add pipeline caching',
  state: 'OPEN',
  author: { display_name: 'Ada Lovelace' },
  source: { branch: { name: 'feature/cache' } },
  destination: { branch: { name: 'main' } },
  created_on: '2026-09-01T10:00:00Z',
  updated_on: '2026-09-02T12:00:00Z',
  reviewers: [{ display_name: 'Grace Hopper' }, { nickname: 'alan' }],
  links: { html: { href: 'https://bitbucket.org/acme/payments/pull-requests/42' } }
};

describe('extractJiraKeys', () => {
  it('finds unique Jira keys in a title', () => {
    expect(extractJiraKeys('PROJ-1 and PROJ-1 plus ABC-99')).toEqual(['PROJ-1', 'ABC-99']);
  });

  it('returns an empty array when there are no keys', () => {
    expect(extractJiraKeys('no keys here')).toEqual([]);
  });
});

describe('statesForFilter', () => {
  it('returns a single state when a valid one is given', () => {
    expect(statesForFilter('MERGED')).toEqual(['MERGED']);
  });

  it('returns all states for ALL or unknown values', () => {
    expect(statesForFilter('ALL')).toEqual(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']);
    expect(statesForFilter(undefined)).toEqual(['OPEN', 'MERGED', 'DECLINED', 'SUPERSEDED']);
  });
});

describe('normalizePullRequest', () => {
  it('maps Bitbucket fields onto the application model', () => {
    expect(normalizePullRequest(rawPr)).toEqual({
      id: '42',
      title: 'PROJ-123 Add pipeline caching',
      state: 'OPEN',
      author: 'Ada Lovelace',
      sourceBranch: 'feature/cache',
      targetBranch: 'main',
      createdOn: '2026-09-01T10:00:00Z',
      updatedOn: '2026-09-02T12:00:00Z',
      webUrl: 'https://bitbucket.org/acme/payments/pull-requests/42',
      reviewers: ['Grace Hopper', 'alan'],
      jiraKeys: ['PROJ-123']
    });
  });

  it('skips malformed pull requests', () => {
    expect(normalizePullRequest({ id: 1 })).toBeNull();
    expect(normalizePullRequest(null)).toBeNull();
  });
});

describe('listPullRequests', () => {
  it('requests pull requests for the repository and normalizes them', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return { values: [rawPr] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const prs = await listPullRequests(workspaceId, repoId, 'ALL', client);

    expect(prs).toHaveLength(1);
    expect(prs[0].id).toBe('42');
    expect(requested[0]).toContain('/pullrequests?');
    expect(requested[0]).toContain('state=OPEN');
    expect(requested[0]).toContain('state=MERGED');
  });

  it('requests only the selected state', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return { values: [] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    await listPullRequests(workspaceId, repoId, 'MERGED', client);

    expect(requested[0]).toContain('state=MERGED');
    expect(requested[0]).not.toContain('state=OPEN');
  });
});
