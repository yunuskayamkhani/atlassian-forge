import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import { normalizeBranch, listBranches } from './branches';

const workspaceId = '{470c176d-3574-44ea-bb41-89e8638bcca4}';
const repoId = '{11111111-1111-1111-1111-111111111111}';

describe('normalizeBranch', () => {
  it('returns a branch name', () => {
    expect(normalizeBranch({ name: 'feature/new-dashboard' })).toBe('feature/new-dashboard');
  });

  it('skips malformed or empty branch names', () => {
    expect(normalizeBranch(null)).toBeNull();
    expect(normalizeBranch({})).toBeNull();
    expect(normalizeBranch({ name: '  ' })).toBeNull();
  });
});

describe('listBranches', () => {
  it('lists and normalizes repository branches', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path) => {
        requested.push(path);
        return { values: [{ name: 'main' }, { name: 'release/1.0' }] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    await expect(listBranches(workspaceId, repoId, client)).resolves.toEqual(['main', 'release/1.0']);
    expect(requested[0]).toContain('/refs/branches?pagelen=100&sort=name');
  });

  it('loads additional branch pages', async () => {
    const client: BitbucketClient = {
      getRelative: async () => ({
        values: [{ name: 'main' }],
        next: 'https://api.bitbucket.org/2.0/repositories/acme/repo/refs/branches?page=2'
      }),
      getAbsolute: async () => ({ values: [{ name: 'release/1.0' }] })
    };

    await expect(listBranches(workspaceId, repoId, client)).resolves.toEqual(['main', 'release/1.0']);
  });
});
