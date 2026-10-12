import { BitbucketApiError } from '../bitbucket/errors';
import type { AppUser } from '../../models/appUser';
import { parseUserList } from '../jira/users';

export function parseAdminList(value: unknown): AppUser[] {
  return parseUserList(value);
}

export function parseSaveAdmins(payload: unknown): AppUser[] {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const admins = parseUserList(record.admins);
  if (admins.length === 0) {
    throw new BitbucketApiError('Add at least one dashboard administrator.', 400, false);
  }
  return admins;
}

export function isListedAdmin(admins: AppUser[], accountId: string): boolean {
  return Boolean(accountId) && admins.some((admin) => admin.accountId === accountId);
}

export function resolveIsAppAdmin(admins: AppUser[], accountId: string, isJiraAdmin: boolean): boolean {
  if (admins.length === 0) {
    return isJiraAdmin;
  }
  return isListedAdmin(admins, accountId);
}
