import { describe, expect, it } from 'vitest';
import { collectPages, mapInBatches, parsePage } from './pagination';
import { BitbucketApiError } from './errors';

describe('parsePage', () => {
  it('reads values and a trusted next link', () => {
    const page = parsePage(
      {
        values: ['a', 'b'],
        next: 'https://api.bitbucket.org/2.0/user/workspaces?page=2'
      },
      (value) => String(value)
    );

    expect(page.values).toEqual(['a', 'b']);
    expect(page.next).toBe('https://api.bitbucket.org/2.0/user/workspaces?page=2');
  });

  it('treats an empty values list as valid', () => {
    const page = parsePage({ values: [] }, (value) => String(value));
    expect(page.values).toEqual([]);
    expect(page.next).toBeUndefined();
  });

  it('rejects malformed payloads', () => {
    expect(() => parsePage(null, (value) => String(value))).toThrow(BitbucketApiError);
    expect(() => parsePage({ values: 'nope' }, (value) => String(value))).toThrow(BitbucketApiError);
  });

  it('ignores untrusted next links', () => {
    const page = parsePage(
      { values: [1], next: 'https://evil.example/next' },
      (value) => Number(value)
    );
    expect(page.next).toBeUndefined();
  });
});

describe('collectPages', () => {
  it('follows next until it is absent', async () => {
    const items = await collectPages({
      fetchFirst: async () => ({
        values: [1, 2],
        next: 'https://api.bitbucket.org/2.0/items?page=2'
      }),
      fetchNext: async () => ({ values: [3] })
    });

    expect(items).toEqual([1, 2, 3]);
  });

  it('stops at the safety limit', async () => {
    const items = await collectPages({
      maxPages: 2,
      maxItems: 10,
      fetchFirst: async () => ({
        values: [1, 2],
        next: 'https://api.bitbucket.org/2.0/items?page=2'
      }),
      fetchNext: async () => ({
        values: [3, 4],
        next: 'https://api.bitbucket.org/2.0/items?page=3'
      })
    });

    expect(items).toEqual([1, 2, 3, 4]);
  });
});

describe('mapInBatches', () => {
  it('limits concurrent requests to the configured batch size and preserves order', async () => {
    let active = 0;
    let maxActive = 0;
    const result = await mapInBatches([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });

    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('rejects invalid batch sizes', async () => {
    await expect(mapInBatches([1], 0, async (value) => value)).rejects.toThrow(
      'Batch size must be a positive integer.'
    );
  });
});
