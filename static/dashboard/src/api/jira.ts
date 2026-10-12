import { invokeResult } from './invokeResult';
import type { JiraStatus, Result } from '../types/models';

export function fetchIssueStatuses(keys: string[]): Promise<Result<Record<string, JiraStatus>>> {
  return invokeResult<Record<string, JiraStatus>>('getIssueStatuses', { keys });
}
