import { errorFromStatus, BitbucketApiError } from './errors';
import { isAllowedBitbucketUrl } from './identifiers';
import { basicAuthHeader, toBitbucketUrl } from './url';

export async function readBitbucketResponse(res: {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}): Promise<unknown> {
  if (!res.ok) {
    throw errorFromStatus(res.status);
  }

  try {
    return await res.json();
  } catch {
    throw new BitbucketApiError('Bitbucket returned a malformed response.', 502, false);
  }
}

export type BitbucketClient = {
  getRelative: (path: string) => Promise<unknown>;
  getAbsolute: (url: string) => Promise<unknown>;
};

export const BITBUCKET_TIMEOUT_MS = 15000;

type FetchFn = (url: string, init: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

async function fetchBitbucket(
  fetchFn: FetchFn,
  url: string,
  headers: Record<string, string>
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BITBUCKET_TIMEOUT_MS);
  const startedAt = Date.now();

  let res;
  try {
    res = await fetchFn(url, { headers, signal: controller.signal });
  } catch (error) {
    const aborted = (error as { name?: string })?.name === 'AbortError';
    console.error(`Bitbucket request failed (${aborted ? 'timeout' : 'network'}): ${url}`);
    throw new BitbucketApiError(
      aborted
        ? 'Bitbucket took too long to respond. Retry in a moment.'
        : 'Could not reach Bitbucket. Check the connection and retry.',
      aborted ? 504 : 502,
      true
    );
  } finally {
    clearTimeout(timer);
  }

  console.log(`Bitbucket ${res.status} in ${Date.now() - startedAt}ms: ${url}`);
  return readBitbucketResponse(res);
}

export async function createForgeClient(): Promise<BitbucketClient> {
  const [{ fetch }, { getBitbucketCredentials }] = await Promise.all([
    import('@forge/api'),
    import('./credentials')
  ]);

  const credentials = await getBitbucketCredentials();
  if (!credentials) {
    throw new BitbucketApiError('Connect Bitbucket to load engineering data.', 401, false);
  }

  const headers = {
    Authorization: basicAuthHeader(credentials.email, credentials.token),
    Accept: 'application/json'
  };

  const fetchFn = fetch as unknown as FetchFn;

  return {
    async getRelative(path) {
      return fetchBitbucket(fetchFn, toBitbucketUrl(path), headers);
    },
    async getAbsolute(url) {
      if (!isAllowedBitbucketUrl(url)) {
        throw new BitbucketApiError('Bitbucket returned an invalid pagination link.', 502, false);
      }

      return fetchBitbucket(fetchFn, url, headers);
    }
  };
}
