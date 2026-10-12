import { BitbucketApiError } from './errors';

const BITBUCKET_API_ORIGIN = 'https://api.bitbucket.org';

export function toBitbucketUrl(path: string): string {
  if (!path.startsWith('/2.0/')) {
    throw new BitbucketApiError('Invalid Bitbucket path.', 400, false);
  }

  return `${BITBUCKET_API_ORIGIN}${path}`;
}

export function basicAuthHeader(email: string, token: string): string {
  return `Basic ${Buffer.from(`${email}:${token}`, 'utf8').toString('base64')}`;
}
