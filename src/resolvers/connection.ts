import { toFailureResult, type Result } from '../services/bitbucket/errors';
import {
  deleteBitbucketCredentials,
  hasBitbucketConnection,
  parseCredentials,
  saveBitbucketCredentials
} from '../services/bitbucket/credentials';
import { listWorkspaces } from '../services/bitbucket/workspaces';
import { assertAppAdmin, isAppAdmin } from '../services/config/admins';

export async function getConnectionStatus(): Promise<Result<{ connected: boolean; isAdmin: boolean }>> {
  try {
    const [connected, isAdmin] = await Promise.all([hasBitbucketConnection(), isAppAdmin()]);
    console.log(`getConnectionStatus -> connected=${connected} isAdmin=${isAdmin}`);
    return { ok: true, data: { connected, isAdmin } };
  } catch (error) {
    console.error('getConnectionStatus failed', error);
    return toFailureResult(error);
  }
}

export async function connectBitbucket(payload: unknown): Promise<Result<{ connected: true }>> {
  let saved = false;
  try {
    await assertAppAdmin();
    const credentials = parseCredentials(payload);
    await saveBitbucketCredentials(credentials);
    saved = true;
    await listWorkspaces();
    return { ok: true, data: { connected: true } };
  } catch (error) {
    if (saved) {
      await deleteBitbucketCredentials();
    }
    return toFailureResult(error);
  }
}

export async function disconnectBitbucket(): Promise<Result<{ connected: false }>> {
  try {
    await assertAppAdmin();
    await deleteBitbucketCredentials();
    return { ok: true, data: { connected: false } };
  } catch (error) {
    return toFailureResult(error);
  }
}
