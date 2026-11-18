import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import {
  extractJiraKeys,
  filterByDestinationBranch,
  filterByUpdatedSince,
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

describe('filterByDestinationBranch', () => {
  it('keeps only pull requests targeting the selected Bitbucket branch', () => {
    const pullRequests = [
      normalizePullRequest(rawPr)!,
      normalizePullRequest({
        ...rawPr,
        id: 43,
        destination: { branch: { name: 'Sprint-67/Development_Sprint-67' } }
      })!
    ];

    expect(filterByDestinationBranch(pullRequests, 'Sprint-67/Development_Sprint-67').map((pr) => pr.id)).toEqual([
      '43'
    ]);
  });

  describe('filterByUpdatedSince', () => {
    it('keeps pull requests updated after the selected range start', () => {
      const pullRequests = [
        normalizePullRequest({ ...rawPr, updated_on: '2026-09-02T12:00:00Z' })!,
        normalizePullRequest({ ...rawPr, id: 43, updated_on: '2026-09-05T12:00:00Z' })!
      ];

      expect(filterByUpdatedSince(pullRequests, Date.parse('2026-09-03T00:00:00Z')).map((pr) => pr.id)).toEqual([
        '43'
      ]);
    });

    it('keeps all pull requests when no start date is selected', () => {
      const pullRequest = normalizePullRequest(rawPr)!;
      expect(filterByUpdatedSince([pullRequest], null)).toEqual([pullRequest]);
    });
  });

  it('keeps all pull requests when no destination branch is selected', () => {
    const pullRequest = normalizePullRequest(rawPr)!;
    expect(filterByDestinationBranch([pullRequest], '')).toEqual([pullRequest]);
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
      declinedBy: '',
      reviewers: ['Grace Hopper', 'alan'],
      approvedReviewers: [],
      jiraKeys: ['PROJ-123']
    });
  });

  it('skips malformed pull requests', () => {
    expect(normalizePullRequest({ id: 1 })).toBeNull();
    expect(normalizePullRequest(null)).toBeNull();
  });

  it('extracts sprint issue keys from PR branches and description', () => {
    expect(
      normalizePullRequest({
        ...rawPr,
        title: 'Add pipeline caching',
        source: { branch: { name: 'feature/PROJ-456-cache' } },
        description: 'Implements PROJ-789'
      })?.jiraKeys
    ).toEqual(['PROJ-456', 'PROJ-789']);
  });

  it('uses reviewer display-name fallbacks and reviewer participants when needed', () => {
    expect(
      normalizePullRequest({
        ...rawPr,
        reviewers: [{ display_name: '', nickname: 'reviewer-handle' }],
        participants: [
          { role: 'REVIEWER', user: { display_name: 'Reviewer Name' } },
          { role: 'PARTICIPANT', user: { display_name: 'Not a reviewer' } }
        ]
      })?.reviewers
    ).toEqual(['reviewer-handle']);

    expect(
      normalizePullRequest({
        ...rawPr,
        reviewers: [],
        participants: [
          { role: 'REVIEWER', user: { display_name: 'Reviewer Name' } },
          { role: 'PARTICIPANT', user: { display_name: 'Not a reviewer' } }
        ]
      })?.reviewers
    ).toEqual(['Reviewer Name']);
  });

  it('includes only reviewer participants who approved', () => {
    expect(
      normalizePullRequest({
        ...rawPr,
        participants: [
          { role: 'REVIEWER', approved: true, user: { display_name: 'Approved Reviewer' } },
          { role: 'REVIEWER', approved: false, user: { display_name: 'Pending Reviewer' } },
          { role: 'PARTICIPANT', approved: true, user: { display_name: 'Approved Participant' } }
        ]
      })?.approvedReviewers
    ).toEqual(['Approved Reviewer']);
  });

  it('normalizes the user who declined the pull request', () => {
    expect(
      normalizePullRequest({
        ...rawPr,
        state: 'DECLINED',
        closed_by: { display_name: 'Declining Reviewer' }
      })?.declinedBy
    ).toBe('Declining Reviewer');
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
    expect(requested[0]).not.toContain('fields=');
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

  it('filters pull requests by the selected destination branch before pagination', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return { values: [rawPr] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    await listPullRequests(workspaceId, repoId, 'ALL', client, 'Sprint-68/Development_Sprint-68');

    const url = new URL(`https://api.bitbucket.org${requested[0]}`);
    expect(url.searchParams.get('q')).toBe('destination.branch.name="Sprint-68/Development_Sprint-68"');
  });

  it('escapes quotes and backslashes in a destination branch filter', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return { values: [] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    await listPullRequests(workspaceId, repoId, 'ALL', client, 'release/"quoted"\\branch');

    const url = new URL(`https://api.bitbucket.org${requested[0]}`);
    expect(url.searchParams.get('q')).toBe('destination.branch.name="release/\\"quoted\\"\\\\branch"');
  });

  it('loads reviewers from the list response without making per-pull-request requests', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return { values: [{ ...rawPr, reviewers: [{ display_name: 'Reviewer from list' }] }] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const pullRequests = await listPullRequests(workspaceId, repoId, 'OPEN', client);

    expect(pullRequests[0].reviewers).toEqual(['Reviewer from list']);
    expect(requested).toHaveLength(1);
  });

  it('loads approval details when the list omits participant fields', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        if (path.endsWith('/pullrequests/42')) {
          return {
            ...rawPr,
            participants: [
              { role: 'REVIEWER', approved: true, user: { display_name: 'Reviewer One' } },
              { role: 'REVIEWER', approved: true, user: { display_name: 'Reviewer Two' } },
              { role: 'REVIEWER', approved: false, user: { display_name: 'Reviewer Three' } }
            ],
            reviewers: [
              { display_name: 'Reviewer One' },
              { display_name: 'Reviewer Two' },
              { display_name: 'Reviewer Three' },
              { display_name: 'Reviewer Four' }
            ]
          };
        }
        return { values: [{ ...rawPr, reviewers: undefined, participants: undefined }] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const pullRequests = await listPullRequests(workspaceId, repoId, 'OPEN', client, undefined, true);

    expect(pullRequests[0].reviewers).toEqual([
      'Reviewer One',
      'Reviewer Two',
      'Reviewer Three',
      'Reviewer Four'
    ]);
    expect(pullRequests[0].approvedReviewers).toEqual(['Reviewer One', 'Reviewer Two']);
    expect(requested).toHaveLength(2);
    expect(requested[1]).toContain('/pullrequests/42');
  });

  it('does not fetch details when the list explicitly returns no reviewers or participants', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return {
          values: [{ ...rawPr, reviewers: [], participants: [] }]
        };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const pullRequests = await listPullRequests(workspaceId, repoId, 'OPEN', client, undefined, true);

    expect(pullRequests[0].reviewers).toEqual([]);
    expect(pullRequests[0].approvedReviewers).toEqual([]);
    expect(requested).toHaveLength(1);
  });

  it('does not fetch approval details when participants are present in the list response', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return {
          values: [
            {
              ...rawPr,
              participants: [
                { role: 'REVIEWER', approved: true, user: { display_name: 'Approved Reviewer' } },
                { role: 'REVIEWER', approved: false, user: { display_name: 'Pending Reviewer' } }
              ]
            }
          ]
        };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const pullRequests = await listPullRequests(workspaceId, repoId, 'OPEN', client, undefined, true);

    expect(pullRequests[0].approvedReviewers).toEqual(['Approved Reviewer']);
    expect(requested).toHaveLength(1);
  });

  it('fetches approval details when participants lack approval state', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        if (path.endsWith('/pullrequests/42')) {
          return {
            ...rawPr,
            participants: [
              { role: 'REVIEWER', approved: true, user: { display_name: 'Approved Reviewer' } }
            ]
          };
        }
        return {
          values: [
            {
              ...rawPr,
              participants: [{ role: 'REVIEWER', user: { display_name: 'Reviewer' } }]
            }
          ]
        };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const pullRequests = await listPullRequests(workspaceId, repoId, 'OPEN', client, undefined, true);

    expect(pullRequests[0].approvedReviewers).toEqual(['Approved Reviewer']);
    expect(requested).toHaveLength(2);
  });
});
