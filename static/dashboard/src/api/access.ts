import { invokeResult } from './invokeResult';
import type { AccessContext, AppUser, JiraBoard, JiraSprint, ProjectMapping, Result } from '../types/models';

export function fetchAccessContext(): Promise<Result<AccessContext>> {
  return invokeResult<AccessContext>('getAccessContext');
}

export function saveProjectMapping(
  mapping: Omit<ProjectMapping, 'id'> & { id?: string }
): Promise<Result<ProjectMapping[]>> {
  return invokeResult<ProjectMapping[]>('saveProjectMapping', mapping as unknown as Record<string, unknown>);
}

export function deleteProjectMapping(id: string): Promise<Result<ProjectMapping[]>> {
  return invokeResult<ProjectMapping[]>('deleteProjectMapping', { id });
}

export function fetchBoards(projectKey: string): Promise<Result<JiraBoard[]>> {
  return invokeResult<JiraBoard[]>('getBoards', { projectKey });
}

export function fetchSprints(boardId: string): Promise<Result<JiraSprint[]>> {
  return invokeResult<JiraSprint[]>('getSprints', { boardId });
}

export function searchUsers(query: string): Promise<Result<AppUser[]>> {
  return invokeResult<AppUser[]>('searchUsers', { query });
}

export function saveDashboardAdmins(admins: AppUser[]): Promise<Result<AppUser[]>> {
  return invokeResult<AppUser[]>('saveDashboardAdmins', { admins });
}
