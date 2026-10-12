import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { fetchIssueStatuses, type JiraStatus } from '../services/jira/issues';

export async function getIssueStatuses(payload: unknown): Promise<Result<Record<string, JiraStatus>>> {
  try {
    const keys = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).keys : undefined;
    const data = await fetchIssueStatuses(keys);
    console.log(`getIssueStatuses -> ${Object.keys(data).length} statuses`);
    return { ok: true, data };
  } catch (error) {
    console.error('getIssueStatuses failed', error);
    return toFailureResult(error);
  }
}
