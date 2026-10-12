import { describe, expect, it } from 'vitest';
import { BitbucketApiError } from './errors';
import { assertRepositoryId, assertWorkspaceId, isAllowedBitbucketUrl } from './identifiers';

describe('identifiers', () => {
  it('accepts Bitbucket workspace UUIDs', () => {
    expect(assertWorkspaceId('{470c176d-3574-44ea-bb41-89e8638bcca4}')).toBe(
      '{470c176d-3574-44ea-bb41-89e8638bcca4}'
    );
  });

  it('rejects unsafe workspace values', () => {
    expect(() => assertWorkspaceId('../evil')).toThrow(BitbucketApiError);
    expect(() => assertWorkspaceId('not a uuid')).toThrow(BitbucketApiError);
  });

  it('accepts repository UUIDs and slugs', () => {
    expect(assertRepositoryId('{11111111-1111-1111-1111-111111111111}')).toContain('1111');
    expect(assertRepositoryId('payments-api')).toBe('payments-api');
  });

  it('rejects unsafe repository values', () => {
    expect(() => assertRepositoryId('../../secret')).toThrow(BitbucketApiError);
  });

  it('allows only Bitbucket API pagination hosts', () => {
    expect(isAllowedBitbucketUrl('https://api.bitbucket.org/2.0/repositories/abc?page=2')).toBe(true);
    expect(isAllowedBitbucketUrl('https://evil.example/2.0/repositories')).toBe(false);
  });
});
