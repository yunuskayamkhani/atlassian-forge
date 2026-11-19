import type { PipelineRun } from '../types/models';
import type { DateWindow } from './commitStats';

const COMPLETED_STATUSES = new Set(['SUCCESSFUL', 'FAILED', 'ERROR', 'STOPPED']);
const FAILED_STATUSES = new Set(['FAILED', 'ERROR']);

export function filterPipelinesByWindow(runs: PipelineRun[], window: DateWindow): PipelineRun[] {
  return runs.filter((run) => {
    const createdAt = new Date(run.createdOn).getTime();
    if (Number.isNaN(createdAt)) {
      return false;
    }
    if (window.from !== null && createdAt < window.from) {
      return false;
    }
    if (window.to !== null && createdAt > window.to) {
      return false;
    }
    return true;
  });
}

export function pipelineSummary(runs: PipelineRun[]): {
  successPercent: number | null;
  failedPercent: number | null;
  failedCount: number;
} {
  const completed = runs.filter((run) => COMPLETED_STATUSES.has(run.status.toUpperCase()));
  const successfulCount = completed.filter((run) => run.status.toUpperCase() === 'SUCCESSFUL').length;
  const failedCount = runs.filter((run) => FAILED_STATUSES.has(run.status.toUpperCase())).length;

  if (completed.length === 0) {
    return { successPercent: null, failedPercent: null, failedCount };
  }

  return {
    successPercent: Math.round((successfulCount / completed.length) * 100),
    failedPercent: Math.round((failedCount / completed.length) * 100),
    failedCount
  };
}
