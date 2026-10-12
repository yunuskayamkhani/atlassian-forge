import { kvs } from '@forge/kvs';
import { parseCredentials, type BitbucketCredentials } from './credentialsParse';

const SECRET_KEY = 'bitbucket-credentials';

export type { BitbucketCredentials };
export { parseCredentials };

export async function getBitbucketCredentials(): Promise<BitbucketCredentials | null> {
  const value = await kvs.getSecret(SECRET_KEY);
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const email = typeof record.email === 'string' ? record.email : '';
  const token = typeof record.token === 'string' ? record.token : '';

  if (!email || !token) {
    return null;
  }

  return { email, token };
}

export async function hasBitbucketConnection(): Promise<boolean> {
  return (await getBitbucketCredentials()) !== null;
}

export async function saveBitbucketCredentials(credentials: BitbucketCredentials): Promise<void> {
  await kvs.setSecret(SECRET_KEY, credentials);
}

export async function deleteBitbucketCredentials(): Promise<void> {
  await kvs.deleteSecret(SECRET_KEY);
}
