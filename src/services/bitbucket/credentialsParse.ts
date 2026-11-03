import { BitbucketApiError } from './errors';

export type BitbucketCredentials = {
  email: string;
  token: string;
};

export function parseCredentials(payload: unknown): BitbucketCredentials {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const email = typeof record.email === 'string' ? record.email.trim() : '';
  const token = typeof record.token === 'string' ? record.token.trim() : '';

  if (!email.includes('@') || email.length > 320) {
    throw new BitbucketApiError('Enter a valid Atlassian account email.', 400, false);
  }

  if (token.length < 8 || token.length > 512 || /[\r\n]/.test(token)) {
    throw new BitbucketApiError('Enter a valid Bitbucket API token.', 400, false);
  }

  return { email, token };
}
