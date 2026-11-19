import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import { listDeployments, normalizeDeployment } from './deployments';

const workspaceId = '{470c176d-3574-44ea-bb41-89e8638bcca4}';
const repositoryId = '{11111111-1111-1111-1111-111111111111}';

const rawDeployment = {
  uuid: '{deployment-uuid}',
  state: { name: 'COMPLETED', url: 'https://example.com/deployments/1' },
  environment: { name: 'Production' },
  release: {
    created_on: '2026-11-18T10:00:00Z',
    url: 'https://bitbucket.org/workspace/repo/pipelines/results/1',
    commit: { hash: '0123456789abcdef' }
  }
};

describe('normalizeDeployment', () => {
  it('maps Bitbucket deployment fields to the dashboard model', () => {
    expect(normalizeDeployment(rawDeployment)).toEqual({
      uuid: '{deployment-uuid}',
      environment: 'Production',
      status: 'COMPLETED',
      commitHash: '0123456789abcdef',
      createdOn: '2026-11-18T10:00:00Z',
      webUrl: 'https://example.com/deployments/1'
    });
  });

  it('skips malformed deployment records and tolerates missing optional fields', () => {
    expect(normalizeDeployment(null)).toBeNull();
    expect(normalizeDeployment({ environment: { name: 'Production' } })).toBeNull();
    expect(normalizeDeployment({ uuid: '{deployment-uuid}' })).toEqual({
      uuid: '{deployment-uuid}',
      environment: '',
      status: 'UNKNOWN',
      commitHash: '',
      createdOn: '',
      webUrl: ''
    });
  });
});

describe('listDeployments', () => {
  it('loads and normalizes repository deployments', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path) => {
        requested.push(path);
        return { values: [rawDeployment] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const deployments = await listDeployments(workspaceId, repositoryId, client);

    expect(deployments).toHaveLength(1);
    expect(deployments[0].environment).toBe('Production');
    expect(requested[0]).toContain('/deployments?pagelen=50');
  });
});
