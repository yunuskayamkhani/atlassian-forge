import { invokeResult } from './invokeResult';
import type { PipelineRun, Result } from '../types/models';

export function fetchPipelines(
  workspaceId: string,
  repositoryId: string
): Promise<Result<PipelineRun[]>> {
  return invokeResult<PipelineRun[]>('getPipelines', { workspaceId, repositoryId });
}
