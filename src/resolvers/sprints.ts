import { BitbucketApiError, toFailureResult, type Result } from '../services/bitbucket/errors';
import { assertAppAdmin } from '../services/config/admins';
import { listBoards, listSprints, type JiraBoard, type JiraSprint } from '../services/jira/sprints';

function asRecord(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
}

export async function getBoards(payload: unknown): Promise<Result<JiraBoard[]>> {
  try {
    await assertAppAdmin();
    const record = asRecord(payload);
    const projectKey = typeof record.projectKey === 'string' ? record.projectKey : '';
    const data = await listBoards(projectKey);
    console.log(`getBoards -> ${data.length} boards`);
    return { ok: true, data };
  } catch (error) {
    console.error('getBoards failed', error);
    return toFailureResult(error);
  }
}

export async function getSprints(payload: unknown): Promise<Result<JiraSprint[]>> {
  try {
    await assertAppAdmin();
    const record = asRecord(payload);
    const boardId = typeof record.boardId === 'string' ? record.boardId : '';
    if (!boardId) {
      throw new BitbucketApiError('Select a Jira board.', 400, false);
    }
    const data = await listSprints(boardId);
    console.log(`getSprints -> ${data.length} sprints`);
    return { ok: true, data };
  } catch (error) {
    console.error('getSprints failed', error);
    return toFailureResult(error);
  }
}
