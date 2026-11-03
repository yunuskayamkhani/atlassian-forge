import { invokeResult } from './invokeResult';
import type { Result, Workspace } from '../types/models';

export function fetchWorkspaces(): Promise<Result<Workspace[]>> {
  return invokeResult<Workspace[]>('getWorkspaces');
}
