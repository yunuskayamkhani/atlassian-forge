import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import { BitbucketApiError } from './errors';
import { listWorkspaces, normalizeWorkspace } from './workspaces';

const workspaceUuid = '{470c176d-3574-44ea-bb41-89e8638bcca4}';

function clientWith(pages: unknown[]): BitbucketClient {
  let index = 0;
  return {
    getRelative: async () => pages[index++] ?? { values: [] },
    getAbsolute: async () => pages[index++] ?? { values: [] }
  };
}

describe('normalizeWorkspace', () => {
  it('reads uuid, slug, and name from a membership payload', () => {
    expect(
      normalizeWorkspace({
        workspace: {
          uuid: workspaceUuid,
          slug: 'acme',
          name: 'Acme'
        }
      })
    ).toEqual({
      id: workspaceUuid,
      slug: 'acme',
      name: 'Acme'
    });
  });

  it('skips malformed memberships', () => {
    expect(normalizeWorkspace({})).toBeNull();
  });
});

describe('listWorkspaces', () => {
  it('returns normalized workspaces', async () => {
    const workspaces = await listWorkspaces(
      clientWith([
        {
          values: [{ workspace: { uuid: workspaceUuid, slug: 'acme', name: 'Acme' } }]
        }
      ])
    );

    expect(workspaces).toEqual([{ id: workspaceUuid, slug: 'acme', name: 'Acme' }]);
  });

  it('returns an empty list', async () => {
    await expect(listWorkspaces(clientWith([{ values: [] }]))).resolves.toEqual([]);
  });

  it('propagates API failures from the client', async () => {
    const client: BitbucketClient = {
      getRelative: async () => {
        throw new BitbucketApiError('denied', 401, false);
      },
      getAbsolute: async () => ({ values: [] })
    };

    await expect(listWorkspaces(client)).rejects.toMatchObject({ status: 401 });
  });
});
