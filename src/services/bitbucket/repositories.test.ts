import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import { BitbucketApiError } from './errors';
import { getRepository, listRepositories, normalizeRepository } from './repositories';

const workspaceId = '{470c176d-3574-44ea-bb41-89e8638bcca4}';
const repoId = '{11111111-1111-1111-1111-111111111111}';

const rawRepo = {
  uuid: repoId,
  name: 'payments',
  full_name: 'acme/payments',
  mainbranch: { name: 'main' },
  links: { html: { href: 'https://bitbucket.org/acme/payments' } }
};

describe('normalizeRepository', () => {
  it('maps Bitbucket fields onto the application model', () => {
    expect(normalizeRepository(rawRepo, workspaceId)).toEqual({
      id: repoId,
      name: 'payments',
      fullName: 'acme/payments',
      workspace: workspaceId,
      mainBranch: 'main',
      webUrl: 'https://bitbucket.org/acme/payments'
    });
  });

  it('skips malformed repositories', () => {
    expect(normalizeRepository({ uuid: repoId }, workspaceId)).toBeNull();
  });
});

describe('listRepositories', () => {
  it('lists repositories for a workspace', async () => {
    const client: BitbucketClient = {
      getRelative: async () => ({ values: [rawRepo] }),
      getAbsolute: async () => ({ values: [] })
    };

    await expect(listRepositories(workspaceId, client)).resolves.toEqual([
      {
        id: repoId,
        name: 'payments',
        fullName: 'acme/payments',
        workspace: workspaceId,
        mainBranch: 'main',
        webUrl: 'https://bitbucket.org/acme/payments'
      }
    ]);
  });

  it('returns an empty list', async () => {
    const client: BitbucketClient = {
      getRelative: async () => ({ values: [] }),
      getAbsolute: async () => ({ values: [] })
    };

    await expect(listRepositories(workspaceId, client)).resolves.toEqual([]);
  });

  it('maps 403 from the client', async () => {
    const client: BitbucketClient = {
      getRelative: async () => {
        throw new BitbucketApiError('forbidden', 403, false);
      },
      getAbsolute: async () => ({ values: [] })
    };

    await expect(listRepositories(workspaceId, client)).rejects.toMatchObject({ status: 403 });
  });
});

describe('getRepository', () => {
  it('verifies a single repository request', async () => {
    const client: BitbucketClient = {
      getRelative: async () => rawRepo,
      getAbsolute: async () => ({ values: [] })
    };

    await expect(getRepository(workspaceId, repoId, client)).resolves.toMatchObject({
      id: repoId,
      name: 'payments'
    });
  });

  it('maps 404 from a missing repository', async () => {
    const client: BitbucketClient = {
      getRelative: async () => {
        throw new BitbucketApiError('missing', 404, false);
      },
      getAbsolute: async () => ({ values: [] })
    };

    await expect(getRepository(workspaceId, 'payments', client)).rejects.toMatchObject({ status: 404 });
  });
});
