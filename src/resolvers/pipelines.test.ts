import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/config/mappings', () => ({
  requireMappedRepo: vi.fn()
}));
vi.mock('../services/bitbucket/pipelines', () => ({
  assertPipelineQuery: vi.fn((payload: unknown) => payload),
  listPipelineRuns: vi.fn()
}));

import { getPipelines } from './pipelines';
import { requireMappedRepo } from '../services/config/mappings';
import { listPipelineRuns } from '../services/bitbucket/pipelines';

describe('getPipelines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('checks mapping access before loading pipeline runs', async () => {
    const runs = [{ uuid: 'pipeline-1' }];
    vi.mocked(listPipelineRuns).mockResolvedValue(runs as never);

    const result = await getPipelines({ workspaceId: 'workspace-1', repositoryId: 'repo-1' });

    expect(requireMappedRepo).toHaveBeenCalledWith('workspace-1', 'repo-1');
    expect(listPipelineRuns).toHaveBeenCalledWith('workspace-1', 'repo-1');
    expect(result).toEqual({ ok: true, data: runs });
  });

  it('returns an access failure without requesting pipeline data', async () => {
    vi.mocked(requireMappedRepo).mockRejectedValue(new Error('not mapped'));

    const result = await getPipelines({ workspaceId: 'workspace-1', repositoryId: 'repo-1' });

    expect(listPipelineRuns).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      status: 500,
      message: 'Bitbucket request failed.',
      retryable: false
    });
  });
});
