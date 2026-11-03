import { kvs } from '@forge/kvs';
import { BitbucketApiError } from '../bitbucket/errors';
import { browsableIdSet, listBrowsableProjects } from '../jira/access';
import { getCurrentUser } from '../jira/users';
import type { ProjectMapping } from '../../models/projectMapping';
import { assertAppAdmin, isAppAdmin } from './admins';
import { mappingForRepo, parseMappingList, parseSaveMapping, visibleMappings } from './mappingsParse';
import {
  DASHBOARD_PROJECT_KEY,
  DASHBOARD_WORKSPACE_SLUG,
  isAllowedRepositoryFullName
} from './dashboardAllowlist';
import { listWorkspaces } from '../bitbucket/workspaces';
import { listRepositories } from '../bitbucket/repositories';

const MAPPING_KEY = 'project-repo-mappings';

export async function listAllMappings(): Promise<ProjectMapping[]> {
  return parseMappingList(await kvs.get(MAPPING_KEY));
}

export async function listVisibleMappings(): Promise<{
  isAdmin: boolean;
  accountId: string;
  mappings: ProjectMapping[];
}> {
  const [isAdmin, current, projects, mappings] = await Promise.all([
    isAppAdmin(),
    getCurrentUser(),
    listBrowsableProjects(),
    listAllMappings()
  ]);

  return {
    isAdmin,
    accountId: current.accountId,
    mappings: visibleMappings(mappings, browsableIdSet(projects), isAdmin, current.accountId).filter(
      (mapping) =>
        mapping.projectKey === DASHBOARD_PROJECT_KEY &&
        mapping.repositories.length > 0 &&
        mapping.repositories.every((repo) => isAllowedRepositoryFullName(repo.fullName))
    )
  };
}

export async function saveMapping(payload: unknown): Promise<ProjectMapping[]> {
  await assertAppAdmin();
  const next = parseSaveMapping(payload);
  if (next.projectKey !== DASHBOARD_PROJECT_KEY) {
    throw new BitbucketApiError(`Only the ${DASHBOARD_PROJECT_KEY} Jira project can be mapped.`, 400, false);
  }
  const [projects, workspaces] = await Promise.all([listBrowsableProjects(), listWorkspaces()]);
  if (!projects.some((project) => project.key === DASHBOARD_PROJECT_KEY && project.id === next.projectId)) {
    throw new BitbucketApiError(`Could not verify the ${DASHBOARD_PROJECT_KEY} Jira project.`, 400, false);
  }
  const workspace = workspaces.find(
    (item) => item.id === next.workspaceId && item.slug.toLowerCase() === DASHBOARD_WORKSPACE_SLUG
  );
  if (!workspace) {
    throw new BitbucketApiError(`Only the ${DASHBOARD_WORKSPACE_SLUG} Bitbucket workspace can be mapped.`, 400, false);
  }
  const repositories = await listRepositories(workspace.id);
  const allowedRepositories = new Map(
    repositories
      .filter((repository) => isAllowedRepositoryFullName(repository.fullName))
      .map((repository) => [repository.id, repository])
  );
  const selectedRepositories = next.repositories.map((repo) => allowedRepositories.get(repo.id));
  if (selectedRepositories.some((repo) => !repo) || selectedRepositories.length === 0) {
    throw new BitbucketApiError('Select only the approved Bitbucket repositories.', 400, false);
  }
  const actualRepositories = selectedRepositories.filter(
    (repo): repo is NonNullable<typeof repo> => repo !== undefined
  );
  next.repositories = actualRepositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.fullName
  }));
  next.workspaceName = workspace.name;
  const mappings = [next];
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
  const [current, projects, mappings] = await Promise.all([
    getCurrentUser(),
    listBrowsableProjects(),
    listAllMappings()
  ]);

  const mapping = mappingForRepo(
    mappings,
    workspaceId,
    repositoryId,
    browsableIdSet(projects),
    false,
    current.accountId
  );
  if (
    !mapping ||
    mapping.projectKey !== DASHBOARD_PROJECT_KEY ||
    mapping.workspaceId !== workspaceId ||
    !mapping.repositories.every((repo) => isAllowedRepositoryFullName(repo.fullName))
  ) {
    throw new BitbucketApiError('This repository is not enabled for you.', 403, false);
  }
  return mapping;
}

export async function assertMappedRepoAccess(workspaceId: string, repositoryId: string): Promise<void> {
  await requireMappedRepo(workspaceId, repositoryId);
}
