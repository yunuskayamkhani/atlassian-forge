import { describe, expect, it } from 'vitest';
import { BitbucketApiError } from '../bitbucket/errors';
import { parseSaveAdmins, resolveIsAppAdmin } from './adminsParse';

const ada = { accountId: 'ada', displayName: 'Ada' };

describe('parseSaveAdmins', () => {
  it('rejects an empty admin list', () => {
    expect(() => parseSaveAdmins({ admins: [] })).toThrow(BitbucketApiError);
  });

  it('keeps named admins', () => {
    expect(parseSaveAdmins({ admins: [ada] })).toEqual([ada]);
  });
});

describe('resolveIsAppAdmin', () => {
  it('uses Jira site admin only while no dashboard admins are saved', () => {
    expect(resolveIsAppAdmin([], 'ada', true)).toBe(true);
    expect(resolveIsAppAdmin([], 'ada', false)).toBe(false);
  });

  it('uses the saved list once admins exist', () => {
    expect(resolveIsAppAdmin([ada], 'ada', false)).toBe(true);
    expect(resolveIsAppAdmin([ada], 'other', true)).toBe(false);
  });
});
