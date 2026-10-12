import { kvs } from '@forge/kvs';
import { BitbucketApiError } from '../bitbucket/errors';
import { browsableIdSet, listBrowsableProjects } from '../jira/access';
import { getCurrentUser } from '../jira/users';
import type { ProjectMapping } from '../../models/projectMapping';
import { assertAppAdmin, isAppAdmin } from './admins';
import { mappingForRepo, parseMappingList, parseSaveMapping, visibleMappings } from './mappingsParse';

const MAPPING_KEY = 'project-repo-mappings';

export async function listAllMappings(): Promise<ProjectMapping[]> {
  return parseMappingList(await kvs.get(MAPPING_KEY));
}

export async function listVisibleMappings(): Promise<{ isAdmin: boolean; mappings: ProjectMapping[] }> {
  const [isAdmin, current, projects, mappings] = await Promise.all([
    isAppAdmin(),
    getCurrentUser(),
    listBrowsableProjects(),
    listAllMappings()
  ]);

  return {
    isAdmin,
    mappings: visibleMappings(mappings, browsableIdSet(projects), isAdmin, current.accountId)
  };
}

export async function saveMapping(payload: unknown): Promise<ProjectMapping[]> {
  await assertAppAdmin();
  const next = parseSaveMapping(payload);
  const current = await listAllMappings();
  const mappings = [...current.filter((mapping) => mapping.projectId !== next.projectId), next];
  await kvs.set(MAPPING_KEY, mappings);
  return mappings;
}

export async function deleteMapping(payload: unknown): Promise<ProjectMapping[]> {
  await assertAppAdmin();
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const id = typeof record.id === 'string' ? record.id : '';
  if (!id) {
    throw new BitbucketApiError('Select a mapping to remove.', 400, false);
  }
  const mappings = (await listAllMappings()).filter((mapping) => mapping.id !== id && mapping.projectId !== id);
  await kvs.set(MAPPING_KEY, mappings);
  return mappings;
}

export async function requireMappedRepo(workspaceId: string, repositoryId: string): Promise<ProjectMapping> {
  const [isAdmin, current, projects, mappings] = await Promise.all([
    isAppAdmin(),
    getCurrentUser(),
    listBrowsableProjects(),
    listAllMappings()
  ]);

  const mapping = mappingForRepo(
    mappings,
    workspaceId,
    repositoryId,
    browsableIdSet(projects),
    isAdmin,
    current.accountId
  );
  if (!mapping) {
    throw new BitbucketApiError('This repository is not enabled for you.', 403, false);
  }
  return mapping;
}

export async function assertMappedRepoAccess(workspaceId: string, repositoryId: string): Promise<void> {
  await requireMappedRepo(workspaceId, repositoryId);
}
