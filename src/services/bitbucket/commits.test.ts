import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import { commitAuthor, firstLine, listCommits, normalizeCommit } from './commits';

const workspaceId = '{470c176d-3574-44ea-bb41-89e8638bcca4}';
const repoId = '{11111111-1111-1111-1111-111111111111}';

const rawCommit = {
  hash: '0123456789abcdef0123456789abcdef01234567',
  message: 'PROJ-1 Add caching\n\nDetailed body text',
  date: '2026-09-05T09:30:00Z',
  author: { user: { display_name: 'Ada Lovelace' }, raw: 'Ada Lovelace <ada@example.com>' },
  links: { html: { href: 'https://bitbucket.org/acme/payments/commits/0123456' } }
};

describe('firstLine', () => {
  it('returns the first line of a message', () => {
    expect(firstLine('title line\nbody')).toBe('title line');
  });
});

describe('commitAuthor', () => {
  it('prefers the linked user display name', () => {
    expect(commitAuthor({ user: { display_name: 'Ada' }, raw: 'x <y@z>' })).toBe('Ada');
  });

  it('falls back to the name portion of the raw string', () => {
    expect(commitAuthor({ raw: 'Grace Hopper <grace@example.com>' })).toBe('Grace Hopper');
  });

  it('returns Unknown when there is no author data', () => {
    expect(commitAuthor(null)).toBe('Unknown');
  });
});

describe('normalizeCommit', () => {
  it('maps Bitbucket fields onto the application model', () => {
    expect(normalizeCommit(rawCommit)).toEqual({
      hash: '0123456789abcdef0123456789abcdef01234567',
      shortHash: '0123456',
      message: 'PROJ-1 Add caching',
      author: 'Ada Lovelace',
      date: '2026-09-05T09:30:00Z',
      webUrl: 'https://bitbucket.org/acme/payments/commits/0123456'
    });
  });

  it('skips commits without a hash', () => {
    expect(normalizeCommit({ message: 'x' })).toBeNull();
  });
});

describe('listCommits', () => {
  it('requests commits for the repository and normalizes them', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path: string) => {
        requested.push(path);
        return { values: [rawCommit] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const commits = await listCommits(workspaceId, repoId, client);

    expect(commits).toHaveLength(1);
    expect(commits[0].shortHash).toBe('0123456');
    expect(requested[0]).toContain('/commits?pagelen=50');
  });
});
