import { toFailureResult, type Result } from '../services/bitbucket/errors';
import { getRepository, listRepositories } from '../services/bitbucket/repositories';
import { assertAppAdmin } from '../services/config/admins';
import type { Repository } from '../models/repository';

export async function getRepositories(payload: unknown): Promise<Result<Repository[]>> {
  const workspaceId =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>).workspaceId : undefined;

  try {
    await assertAppAdmin();
    return { ok: true, data: await listRepositories(workspaceId as string) };
  } catch (error) {
    return toFailureResult(error);
  }
}

export async function getRepositoryDetails(payload: unknown): Promise<Result<Repository>> {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};

  try {
    await assertAppAdmin();
    return {
      ok: true,
      data: await getRepository(record.workspaceId as string, record.repositoryId as string)
    };
  } catch (error) {
    return toFailureResult(error);
  }
}
