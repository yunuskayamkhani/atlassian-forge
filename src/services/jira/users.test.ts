import { describe, expect, it } from 'vitest';
import { parseUser, parseUserList } from './users';

describe('parseUser', () => {
  it('maps accountId and displayName', () => {
    expect(parseUser({ accountId: 'abc', displayName: 'Ada' })).toEqual({
      accountId: 'abc',
      displayName: 'Ada'
    });
  });

  it('skips users without an account id', () => {
    expect(parseUser({ displayName: 'Ada' })).toBeNull();
  });
});

describe('parseUserList', () => {
  it('keeps unique users', () => {
    expect(
      parseUserList([
        { accountId: 'abc', displayName: 'Ada' },
        { accountId: 'abc', displayName: 'Ada' },
        { displayName: 'No id' }
      ])
    ).toEqual([{ accountId: 'abc', displayName: 'Ada' }]);
  });
});
