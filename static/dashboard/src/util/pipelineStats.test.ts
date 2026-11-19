import { describe, expect, it } from 'vitest';
import { filterPipelinesByWindow, pipelineSummary } from './pipelineStats';
import type { PipelineRun } from '../types/models';

function run(status: string, createdOn = '2026-11-18T12:00:00Z'): PipelineRun {
  return {
    uuid: status,
    buildNumber: 1,
    status,
    branch: 'main',
    commitHash: 'abc123',
    trigger: 'Push',
    createdOn,
    completedOn: createdOn,
    buildSeconds: 30,
    webUrl: ''
  };
}

describe('filterPipelinesByWindow', () => {
  it('filters pipeline runs by created date', () => {
    const result = filterPipelinesByWindow(
      [run('SUCCESSFUL'), run('FAILED', '2026-11-01T12:00:00Z')],
      { from: Date.parse('2026-11-10T00:00:00Z'), to: null }
    );

    expect(result.map((pipeline) => pipeline.status)).toEqual(['SUCCESSFUL']);
  });
});

describe('pipelineSummary', () => {
  it('calculates success and failure percentages from completed runs only', () => {
    expect(pipelineSummary([run('SUCCESSFUL'), run('FAILED'), run('IN_PROGRESS')])).toEqual({
      successPercent: 50,
      failedPercent: 50,
      failedCount: 1
    });
  });
});
