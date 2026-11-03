import { kvs } from '@forge/kvs';
import { BitbucketApiError } from '../bitbucket/errors';
import type { AppUser } from '../../models/appUser';
import { isJiraAdmin } from '../jira/access';
import { getCurrentUser } from '../jira/users';
import { isListedAdmin, parseAdminList, parseSaveAdmins, resolveIsAppAdmin } from './adminsParse';

const ADMIN_KEY = 'dashboard-admins';

export async function listAdmins(): Promise<AppUser[]> {
  return parseAdminList(await kvs.get(ADMIN_KEY));
}

export async function isAppAdmin(): Promise<boolean> {
  const [admins, current, jiraAdmin] = await Promise.all([listAdmins(), getCurrentUser(), isJiraAdmin()]);
  return resolveIsAppAdmin(admins, current.accountId, jiraAdmin);
}

export async function assertAppAdmin(): Promise<void> {
  if (!(await isAppAdmin())) {
    throw new BitbucketApiError('Only a dashboard administrator can do that.', 403, false);
  }
}

export async function saveAdmins(payload: unknown): Promise<AppUser[]> {
  await assertAppAdmin();
  const current = await getCurrentUser();
  const admins = parseSaveAdmins(payload);
  const next = isListedAdmin(admins, current.accountId) ? admins : [current, ...admins];
  await kvs.set(ADMIN_KEY, next);
  return next;
}
