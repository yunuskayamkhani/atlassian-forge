import { BitbucketApiError } from './errors';

const UUID = /^\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}?$/;
const REPO_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export function assertWorkspaceId(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new BitbucketApiError('Invalid workspace.', 400, false);
  }

  return value;
}

export function assertRepositoryId(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BitbucketApiError('Invalid repository.', 400, false);
  }

  if (UUID.test(value) || REPO_ID.test(value)) {
    return value;
  }

  throw new BitbucketApiError('Invalid repository.', 400, false);
}

export function isAllowedBitbucketUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'api.bitbucket.org';
  } catch {
    return false;
  }
}
