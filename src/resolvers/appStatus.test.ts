import { describe, expect, it } from 'vitest';
import { getAppStatus } from './appStatus';

describe('getAppStatus', () => {
  it('returns a ready app status payload', () => {
    const status = getAppStatus();

    expect(status.ok).toBe(true);
    expect(status.name).toBe('Bitbucket Engineering Dashboard');
    expect(status.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
