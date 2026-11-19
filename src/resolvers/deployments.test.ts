import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/config/mappings', () => ({
  requireMappedRepo: vi.fn()
}));
vi.mock('../services/bitbucket/deployments', () => ({
  assertDeploymentQuery: vi.fn((payload: unknown) => payload),
  listDeployments: vi.fn()
}));

import { getDeployments } from './deployments';
import { requireMappedRepo } from '../services/config/mappings';
import { listDeployments } from '../services/bitbucket/deployments';

describe('getDeployments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks mapping access before loading deployment history', async () => {
    const deployments = [{ uuid: 'deployment-1' }];
    vi.mocked(listDeployments).mockResolvedValue(deployments as never);

    const result = await getDeployments({ workspaceId: 'workspace-1', repositoryId: 'repo-1' });

    expect(requireMappedRepo).toHaveBeenCalledWith('workspace-1', 'repo-1');
    expect(listDeployments).toHaveBeenCalledWith('workspace-1', 'repo-1');
    expect(result).toEqual({ ok: true, data: deployments });
  });

  it('returns an access failure without requesting deployment data', async () => {
    vi.mocked(requireMappedRepo).mockRejectedValue(new Error('not mapped'));

    const result = await getDeployments({ workspaceId: 'workspace-1', repositoryId: 'repo-1' });

    expect(listDeployments).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      status: 500,
      message: 'Bitbucket request failed.',
      retryable: false
    });
  });
});
