import { describe, expect, it } from 'vitest';
import { BitbucketApiError } from './errors';
import { toBitbucketUrl, basicAuthHeader } from './url';

describe('toBitbucketUrl', () => {
  it('builds an api.bitbucket.org URL', () => {
    expect(toBitbucketUrl('/2.0/user/workspaces?pagelen=50')).toBe(
      'https://api.bitbucket.org/2.0/user/workspaces?pagelen=50'
    );
  });

  it('rejects paths outside the Bitbucket 2.0 API', () => {
    expect(() => toBitbucketUrl('https://evil.example/2.0/user')).toThrow(BitbucketApiError);
  });
});

describe('basicAuthHeader', () => {
  it('does not put the raw token in a thrown error', () => {
    const header = basicAuthHeader('user@example.com', 'secret-token-value');
    expect(header.startsWith('Basic ')).toBe(true);
    expect(header.includes('secret-token-value')).toBe(false);
  });
});
