import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { assertPipelineQuery, listPipelineRuns } from '../services/bitbucket/pipelines';
import { requireMappedRepo } from '../services/config/mappings';
import type { PipelineRun } from '../models/pipeline';

export async function getPipelines(payload: unknown): Promise<Result<PipelineRun[]>> {
  try {
    const { workspaceId, repositoryId } = assertPipelineQuery(payload);
    await requireMappedRepo(workspaceId, repositoryId);
    const data = await listPipelineRuns(workspaceId, repositoryId);
    console.log(`getPipelines -> ${data.length} pipeline runs`);
    return { ok: true, data };
  } catch (error) {
    console.error('getPipelines failed', error);
    return toFailureResult(error);
  }
}
