import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteProjectMapping, fetchAccessContext, saveDashboardAdmins, saveProjectMapping } from '../api/access';
import { removeBitbucketConnection, saveBitbucketConnection } from '../api/connection';
import { fetchRepositories } from '../api/repositories';
import { fetchWorkspaces } from '../api/workspaces';
import { useFilters } from './FilterContext';
import type { AppUser, JiraProject, ProjectMapping, Repository, Workspace } from '../types/models';
import type { DataSourceStatus, LoadState } from '../types/status';

export type DiscoveryState = {
  loadState: LoadState;
  needsConnection: boolean;
  isAdmin: boolean;
  admins: AppUser[];
  mappings: ProjectMapping[];
  jiraProjects: JiraProject[];
  workspaces: Workspace[];
  repositories: Repository[];
  lastUpdated: string | null;
  errorMessage: string | null;
  retryable: boolean;
  isRefreshing: boolean;
  repositoryStatus: DataSourceStatus['state'];
  load: () => Promise<void>;
  connect: (email: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  saveMapping: (mapping: Omit<ProjectMapping, 'id'> & { id?: string }) => Promise<boolean>;
  saveAdmins: (admins: AppUser[]) => Promise<boolean>;
  removeMapping: (id: string) => Promise<void>;
  loadAdminRepositories: (workspaceId: string) => Promise<Repository[]>;
};

function reposForMapping(mapping: ProjectMapping | undefined): Repository[] {
  if (!mapping) {
    return [];
  }
  return mapping.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.fullName,
    workspace: mapping.workspaceId,
    webUrl: ''
  }));
}

export function useDiscovery(): DiscoveryState {
  const { filters, updateFilters } = useFilters();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [needsConnection, setNeedsConnection] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [admins, setAdmins] = useState<AppUser[]>([]);
  const [mappings, setMappings] = useState<ProjectMapping[]>([]);
  const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const enabledMappings = useMemo(() => mappings.filter((mapping) => mapping.enabled), [mappings]);
  const selectedMapping = enabledMappings.find((mapping) => mapping.projectId === filters.projectId);
  const repositories = reposForMapping(selectedMapping);
  const repositoryStatus: DataSourceStatus['state'] = selectedMapping ? 'loaded' : 'pending';

  const applyMappings = useCallback(
    (next: ProjectMapping[], projectId?: string | null) => {
      setMappings(next);
      const enabled = next.filter((mapping) => mapping.enabled);
      const selected =
        enabled.find((mapping) => mapping.projectId === (projectId ?? filters.projectId)) ?? enabled[0];
      if (!selected) {
        updateFilters({ projectId: null, workspaceId: null, repositoryId: 'ALL' });
        return;
      }
      updateFilters({
        projectId: selected.projectId,
        workspaceId: selected.workspaceId,
        repositoryId: selected.repositories.length === 1 ? selected.repositories[0].id : 'ALL'
      });
    },
    [filters.projectId, updateFilters]
  );

  const loadAdminWorkspaces = useCallback(async () => {
    const result = await fetchWorkspaces();
    if (result.ok) {
      setWorkspaces(result.data);
      return;
    }
    if (result.status !== 403) {
      setErrorMessage(result.message);
      setRetryable(result.retryable);
    }
  }, []);

  const load = useCallback(async () => {
    setIsRefreshing(true);
    if (!lastUpdated && !needsConnection) {
      setLoadState('loading');
    }
    setErrorMessage(null);

    try {
      const access = await fetchAccessContext();
      if (!access.ok) {
        setLoadState('error');
        setErrorMessage(access.message);
        setRetryable(access.retryable);
        return;
      }

      setIsAdmin(access.data.isAdmin);
      setAdmins(access.data.admins ?? []);
      setJiraProjects(access.data.jiraProjects);
      setNeedsConnection(!access.data.connected);
      setLastUpdated(new Date().toISOString());
      setLoadState('ready');

      if (!access.data.connected) {
        setMappings([]);
        setWorkspaces([]);
        return;
      }

      applyMappings(access.data.mappings);
      if (access.data.isAdmin) {
        await loadAdminWorkspaces();
      }
    } catch (error) {
      setLoadState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load dashboard.');
      setRetryable(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [applyMappings, lastUpdated, loadAdminWorkspaces, needsConnection]);

  const connect = useCallback(
    async (email: string, token: string) => {
      setIsRefreshing(true);
      setErrorMessage(null);
      const result = await saveBitbucketConnection(email, token);
      setIsRefreshing(false);

      if (!result.ok) {
        setNeedsConnection(true);
        setErrorMessage(result.message);
        setRetryable(result.retryable);
        return;
      }

      await load();
    },
    [load]
  );

  const disconnect = useCallback(async () => {
    const result = await removeBitbucketConnection();
    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }
    setWorkspaces([]);
    setMappings([]);
    setNeedsConnection(true);
    setLastUpdated(null);
    setLoadState('ready');
  }, []);

  const saveMapping = useCallback(
    async (mapping: Omit<ProjectMapping, 'id'> & { id?: string }) => {
      const result = await saveProjectMapping(mapping);
      if (!result.ok) {
        setErrorMessage(result.message);
        setRetryable(result.retryable);
        return false;
      }
      applyMappings(result.data, mapping.projectId);
      return true;
    },
    [applyMappings]
  );

  const saveAdmins = useCallback(async (next: AppUser[]) => {
    const result = await saveDashboardAdmins(next);
    if (!result.ok) {
      setErrorMessage(result.message);
      setRetryable(result.retryable);
      return false;
    }
    setAdmins(result.data);
    return true;
  }, []);

  const removeMapping = useCallback(
    async (id: string) => {
      const result = await deleteProjectMapping(id);
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      applyMappings(result.data);
    },
    [applyMappings]
  );

  const loadAdminRepositories = useCallback(async (workspaceId: string) => {
    const result = await fetchRepositories(workspaceId);
    if (!result.ok) {
      setErrorMessage(result.message);
      return [];
    }
    return result.data;
  }, []);

  useEffect(() => {
    void load();
  }, []);

  return {
    loadState,
    needsConnection,
    isAdmin,
    admins,
    mappings,
    jiraProjects,
    workspaces,
    repositories,
    lastUpdated,
    errorMessage,
    retryable,
    isRefreshing,
    repositoryStatus,
    load,
    connect,
    disconnect,
    saveMapping,
    saveAdmins,
    removeMapping,
    loadAdminRepositories
  };
}
