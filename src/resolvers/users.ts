import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { assertAppAdmin } from '../services/config/admins';
import { searchJiraUsers } from '../services/jira/users';
import type { AppUser } from '../models/appUser';

export async function searchUsers(payload: unknown): Promise<Result<AppUser[]>> {
  try {
    await assertAppAdmin();
    const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const query = typeof record.query === 'string' ? record.query : '';
    const data = await searchJiraUsers(query);
    console.log(`searchUsers -> ${data.length} users`);
    return { ok: true, data };
  } catch (error) {
    console.error('searchUsers failed', error);
    return toFailureResult(error);
  }
}
