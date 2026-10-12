import { describe, expect, it } from 'vitest';
import { parseCredentials } from './credentialsParse';
import { BitbucketApiError } from './errors';

describe('parseCredentials', () => {
  it('accepts an email and token', () => {
    expect(parseCredentials({ email: 'dev@example.com', token: 'abcdefghijklmnop' })).toEqual({
      email: 'dev@example.com',
      token: 'abcdefghijklmnop'
    });
  });

  it('rejects missing values', () => {
    expect(() => parseCredentials({ email: 'dev@example.com' })).toThrow(BitbucketApiError);
    expect(() => parseCredentials({ token: 'abcdefghijklmnop' })).toThrow(BitbucketApiError);
  });
});
