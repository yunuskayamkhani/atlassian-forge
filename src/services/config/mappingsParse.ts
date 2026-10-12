import { BitbucketApiError } from '../bitbucket/errors';
import type { MappedRepository, ProjectMapping, SprintMode } from '../../models/projectMapping';
import { parseUserList } from '../jira/users';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function parseRepository(raw: unknown): MappedRepository | null {
  const record = asRecord(raw);
  const id = typeof record?.id === 'string' ? record.id : '';
  const name = typeof record?.name === 'string' ? record.name : '';
  const fullName = typeof record?.fullName === 'string' ? record.fullName : name;
  if (!id || !name) {
    return null;
  }
  return { id, name, fullName };
}

function parseSprintMode(value: unknown): SprintMode {
  return value === 'active' || value === 'selected' ? value : 'none';
}

export function parseMapping(raw: unknown): ProjectMapping | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const projectId = typeof record.projectId === 'string' ? record.projectId : '';
  const projectKey = typeof record.projectKey === 'string' ? record.projectKey : '';
  const workspaceId = typeof record.workspaceId === 'string' ? record.workspaceId : '';
  const repos = Array.isArray(record.repositories)
    ? record.repositories.map(parseRepository).filter((repo): repo is MappedRepository => repo !== null)
    : [];

  if (!projectId || !projectKey || !workspaceId || repos.length === 0) {
    return null;
  }

  return {
    id: typeof record.id === 'string' && record.id ? record.id : projectId,
    enabled: record.enabled !== false,
    projectId,
    projectKey,
    projectName: typeof record.projectName === 'string' && record.projectName ? record.projectName : projectKey,
    workspaceId,
    workspaceName: typeof record.workspaceName === 'string' ? record.workspaceName : '',
    repositories: repos,
    sprintMode: parseSprintMode(record.sprintMode),
    boardId: typeof record.boardId === 'string' ? record.boardId : '',
    boardName: typeof record.boardName === 'string' ? record.boardName : '',
    sprintId: typeof record.sprintId === 'string' ? record.sprintId : '',
    sprintName: typeof record.sprintName === 'string' ? record.sprintName : '',
    viewers: parseUserList(record.viewers)
  };
}

export function parseMappingList(value: unknown): ProjectMapping[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(parseMapping).filter((mapping): mapping is ProjectMapping => mapping !== null);
}

export function parseSaveMapping(payload: unknown): ProjectMapping {
  const mapping = parseMapping(payload);
  if (!mapping) {
    throw new BitbucketApiError('Select a Jira project and at least one Bitbucket repository.', 400, false);
  }
  if (mapping.sprintMode === 'active' && !mapping.boardId) {
    throw new BitbucketApiError('Select a Jira board to use the active sprint.', 400, false);
  }
  if (mapping.sprintMode === 'selected' && !mapping.sprintId) {
    throw new BitbucketApiError('Select the sprint the client should see.', 400, false);
  }
  return { ...mapping, id: mapping.projectId };
}

function canViewMapping(mapping: ProjectMapping, accountId: string, isAdmin: boolean): boolean {
  if (isAdmin) {
    return true;
  }
  if (mapping.viewers.length === 0) {
    return true;
  }
  return mapping.viewers.some((viewer) => viewer.accountId === accountId);
}

export function visibleMappings(
  mappings: ProjectMapping[],
  browsable: Set<string>,
  isAdmin: boolean,
  accountId = ''
): ProjectMapping[] {
  return mappings.filter((mapping) => {
    if (!isAdmin && !mapping.enabled) {
      return false;
    }
    if (!canViewMapping(mapping, accountId, isAdmin)) {
      return false;
    }
    return browsable.has(mapping.projectId) || browsable.has(mapping.projectKey);
  });
}

export function mappingAllowsRepo(
  mappings: ProjectMapping[],
  workspaceId: string,
  repositoryId: string,
  browsable: Set<string>,
  isAdmin: boolean,
  accountId = ''
): boolean {
  return visibleMappings(mappings, browsable, isAdmin, accountId).some(
    (mapping) =>
      mapping.enabled &&
      mapping.workspaceId === workspaceId &&
      mapping.repositories.some((repo) => repo.id === repositoryId)
  );
}

export function mappingForRepo(
  mappings: ProjectMapping[],
  workspaceId: string,
  repositoryId: string,
  browsable: Set<string>,
  isAdmin: boolean,
  accountId = ''
): ProjectMapping | null {
  return (
    visibleMappings(mappings, browsable, isAdmin, accountId).find(
      (mapping) =>
        mapping.enabled &&
        mapping.workspaceId === workspaceId &&
        mapping.repositories.some((repo) => repo.id === repositoryId)
    ) ?? null
  );
}
