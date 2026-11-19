import { describe, expect, it } from 'vitest';
import type { BitbucketClient } from './client';
import { listPipelineRuns, normalizePipelineRun } from './pipelines';

const workspaceId = '{470c176d-3574-44ea-bb41-89e8638bcca4}';
const repositoryId = '{11111111-1111-1111-1111-111111111111}';

const rawPipeline = {
  uuid: '{pipeline-uuid}',
  build_number: 14,
  state: {
    name: 'COMPLETED',
    result: { name: 'SUCCESSFUL' }
  },
  target: {
    ref_name: 'main',
    commit: { hash: '0123456789abcdef' }
  },
  trigger: { name: 'Push' },
  created_on: '2026-11-18T10:00:00Z',
  completed_on: '2026-11-18T10:05:00Z',
  build_seconds_used: 300,
  links: { html: { href: 'https://bitbucket.org/acme/repo/addon/pipelines/home#!/results/14' } }
};

describe('normalizePipelineRun', () => {
  it('maps Bitbucket pipeline fields to the dashboard model', () => {
    expect(normalizePipelineRun(rawPipeline)).toEqual({
      uuid: '{pipeline-uuid}',
      buildNumber: 14,
      status: 'SUCCESSFUL',
      branch: 'main',
      commitHash: '0123456789abcdef',
      trigger: 'Push',
      createdOn: '2026-11-18T10:00:00Z',
      completedOn: '2026-11-18T10:05:00Z',
      buildSeconds: 300,
      webUrl: 'https://bitbucket.org/acme/repo/addon/pipelines/home#!/results/14'
    });
  });

  it('skips malformed pipeline records', () => {
    expect(normalizePipelineRun(null)).toBeNull();
    expect(normalizePipelineRun({ build_number: 1 })).toBeNull();
  });
});

describe('listPipelineRuns', () => {
  it('loads and normalizes repository pipelines', async () => {
    const requested: string[] = [];
    const client: BitbucketClient = {
      getRelative: async (path) => {
        requested.push(path);
        return { values: [rawPipeline] };
      },
      getAbsolute: async () => ({ values: [] })
    };

    const runs = await listPipelineRuns(workspaceId, repositoryId, client);

    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe('SUCCESSFUL');
    expect(requested[0]).toContain('/pipelines?pagelen=50');
    expect(requested[0]).toContain('sort=-created_on');
  });
});
