import { describe, expect, it } from 'vitest';
import { readBitbucketResponse } from './client';
import { BitbucketApiError } from './errors';

describe('readBitbucketResponse', () => {
  it.each([
    [401, false],
    [403, false],
    [404, false],
    [429, true]
  ])('maps %s to a structured error', async (status, retryable) => {
    const error = await readBitbucketResponse(new Response('{}', { status })).catch((caught) => caught);

    expect(error).toBeInstanceOf(BitbucketApiError);
    expect((error as BitbucketApiError).status).toBe(status);
    expect((error as BitbucketApiError).retryable).toBe(retryable);
  });

  it('returns JSON for a successful response', async () => {
    const payload = await readBitbucketResponse(
      new Response(JSON.stringify({ values: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    expect(payload).toEqual({ values: [] });
  });

  it('rejects malformed JSON', async () => {
    await expect(readBitbucketResponse(new Response('not-json', { status: 200 }))).rejects.toBeInstanceOf(
      BitbucketApiError
    );
  });
});
