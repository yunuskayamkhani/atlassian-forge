import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { listWorkspaces } from '../services/bitbucket/workspaces';
import { assertAppAdmin } from '../services/config/admins';
import type { Workspace } from '../models/workspace';

export async function getWorkspaces(): Promise<Result<Workspace[]>> {
  try {
    await assertAppAdmin();
    const data = await listWorkspaces();
    console.log(`getWorkspaces -> ${data.length} workspaces`);
    return { ok: true, data };
  } catch (error) {
    console.error('getWorkspaces failed', error);
    return toFailureResult(error);
  }
}
