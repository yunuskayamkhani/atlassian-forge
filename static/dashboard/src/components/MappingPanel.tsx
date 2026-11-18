import { useEffect, useRef, useState } from 'react';
import { UserPicker } from './UserPicker';
import type { AppUser, JiraProject, ProjectMapping, Repository, Result, Workspace } from '../types/models';

function branchSummary(mapping: ProjectMapping): string {
  return mapping.targetBranch ? `destination: ${mapping.targetBranch}` : 'all destination branches';
}

export function MappingPanel({
  mappings,
  jiraProjects,
  workspaces,
  onLoadRepositories,
  onLoadTargetBranches,
  onSave,
  onDelete
}: {
  mappings: ProjectMapping[];
  jiraProjects: JiraProject[];
  workspaces: Workspace[];
  onLoadRepositories: (workspaceId: string) => Promise<Repository[]>;
  onLoadTargetBranches: (workspaceId: string, repositoryIds: string[]) => Promise<Result<string[]>>;
  onSave: (mapping: Omit<ProjectMapping, 'id'> & { id?: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const savedMapping = mappings[0];
  const [projectId, setProjectId] = useState(savedMapping?.projectId ?? jiraProjects[0]?.id ?? '');
  const [workspaceId, setWorkspaceId] = useState(savedMapping?.workspaceId ?? workspaces[0]?.id ?? '');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [repositoryIds, setRepositoryIds] = useState<string[]>(
    savedMapping?.repositories.map((repo) => repo.id) ?? []
  );
  const pendingRepositoryIds = useRef<string[] | null>(
    savedMapping?.repositories.map((repo) => repo.id) ?? null
  );
  const [enabled, setEnabled] = useState(savedMapping?.enabled ?? true);
  const [targetBranch, setTargetBranch] = useState(savedMapping?.targetBranch ?? '');
  const [targetBranches, setTargetBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<AppUser[]>(savedMapping?.viewers ?? []);
  const [saving, setSaving] = useState(false);

  const project = jiraProjects.find((item) => item.id === projectId);
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const selectedRepositories = repos.filter((item) => repositoryIds.includes(item.id));
  const repositoryIdKey = [...repositoryIds].sort().join(',');

  useEffect(() => {
    if (!workspaceId) {
      setRepos([]);
      setRepositoryIds([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const next = await onLoadRepositories(workspaceId);
      if (cancelled) {
        return;
      }
      setRepos(next);
      const wanted = pendingRepositoryIds.current;
      setRepositoryIds(
        wanted
          ? wanted.filter((id) => next.some((repo) => repo.id === id))
          : next.map((repo) => repo.id)
      );
      pendingRepositoryIds.current = null;
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, onLoadRepositories]);

  useEffect(() => {
    if (!workspaceId || repositoryIds.length === 0) {
      setTargetBranches([]);
      setBranchError(null);
      setBranchesLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setBranchesLoading(true);
      const result = await onLoadTargetBranches(workspaceId, repositoryIds);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setBranchError(result.message);
        setTargetBranches([]);
        setBranchesLoading(false);
        return;
      }
      setBranchError(null);
      setTargetBranches(result.data);
      setBranchesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, repositoryIdKey, onLoadTargetBranches]);

  return (
    <section className="connect-card" aria-labelledby="mapping-title">
      <h2 id="mapping-title">Project access</h2>
      <p>
        Map a Jira project to Bitbucket repositories, choose a pull request destination branch, then pick who can view it.
        People who are not dashboard admins never see this panel.
      </p>

      <form
        className="connect-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!project || !workspace || selectedRepositories.length === 0) {
            return;
          }
          setSaving(true);
          void onSave({
            enabled,
            projectId: project.id,
            projectKey: project.key,
            projectName: project.name,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            repositories: selectedRepositories.map((repo) => ({
              id: repo.id,
              name: repo.name,
              fullName: repo.fullName
            })),
            sprintMode: 'none',
            boardId: '',
            boardName: '',
            sprintId: '',
            sprintName: '',
            targetBranch,
            viewers
          }).finally(() => setSaving(false));
        }}
      >
        <label className="filter-field">
          <span>Jira project</span>
          <select
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              setTargetBranch('');
            }}
            aria-label="Map Jira project"
            required
          >
            <option value="">Select project</option>
            {jiraProjects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.key} — {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Bitbucket workspace</span>
          <select
            value={workspaceId}
            onChange={(event) => {
              pendingRepositoryIds.current = null;
              setRepositoryIds([]);
              setTargetBranch('');
              setWorkspaceId(event.target.value);
            }}
            aria-label="Map Bitbucket workspace"
            required
          >
            <option value="">Select workspace</option>
            {workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-field" role="group" aria-labelledby="repository-selection-label">
          <span id="repository-selection-label">Bitbucket repository</span>
          {repos.map((item) => (
            <label key={item.id} className="checkbox-field">
              <input
                type="checkbox"
                checked={repositoryIds.includes(item.id)}
                onChange={(event) => {
                  setTargetBranch('');
                  setRepositoryIds((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id)
                  );
                }}
              />
              <span>{item.fullName}</span>
            </label>
          ))}
          {repos.length === 0 ? <span className="muted">No approved repositories found.</span> : null}
          <span className="muted">Select one or both approved repositories.</span>
          {selectedRepositories.length === 0 ? (
            <span className="connect-error" role="alert">Select at least one repository.</span>
          ) : null}
        </div>
        <label className="filter-field">
          <span>Pull request destination branch</span>
          <select
            value={targetBranch}
            onChange={(event) => setTargetBranch(event.target.value)}
            aria-label="Pull request destination branch"
            disabled={branchesLoading || targetBranches.length === 0}
          >
            <option value="">All destination branches</option>
            {targetBranch && !targetBranches.includes(targetBranch) ? (
              <option value={targetBranch}>{targetBranch}</option>
            ) : null}
            {targetBranches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </label>
        <p className="muted">
          Branch options come from Bitbucket pull request destination branches. Selecting a branch shows its pull
          requests and the commits included in those pull requests.
        </p>
        {branchesLoading ? <p className="muted">Loading destination branches from Bitbucket…</p> : null}
        {branchError ? <p className="connect-error">{branchError}</p> : null}
        {!branchesLoading && !branchError && repositoryIds.length > 0 && targetBranches.length === 0 ? (
          <p className="muted">No pull request destination branches found in the selected repositories.</p>
        ) : null}
        <UserPicker
          selected={viewers}
          onChange={setViewers}
          label="Viewers for this board"
          hint="Only these listed users can view Bitbucket data. Add at least one viewer; leaving this list empty grants access to nobody, including dashboard admins."
        />
        {viewers.length === 0 ? (
          <p className="connect-error" role="alert">
            Add at least one viewer before saving. An empty list means no one can view Bitbucket data.
          </p>
        ) : null}
        <label className="filter-field checkbox-field">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          <span>Enabled for viewers</span>
        </label>
        <button type="submit" className="refresh-button"                 disabled={saving || selectedRepositories.length === 0 || viewers.length === 0}>
          {saving ? 'Saving…' : 'Save mapping'}
        </button>
      </form>

      {mappings.length === 0 ? (
        <p className="muted">No mappings yet. Save one above so viewers can open the dashboard.</p>
      ) : (
        <ul className="mapping-list">
          {mappings.map((mapping) => (
            <li key={mapping.id}>
              <span>
                <strong>
                  {mapping.projectKey} — {mapping.projectName}
                </strong>
                {' → '}
                {mapping.repositories.map((repo) => repo.name).join(', ')}
                {` (${branchSummary(mapping)})`}
                {mapping.viewers.length > 0 ? ` · ${mapping.viewers.length} viewer${mapping.viewers.length === 1 ? '' : 's'}` : ' · all project browsers'}
                {mapping.enabled ? '' : ' (disabled)'}
              </span>
              <span className="mapping-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setProjectId(mapping.projectId);
                    pendingRepositoryIds.current = mapping.repositories.map((repo) => repo.id);
                    setWorkspaceId(mapping.workspaceId);
                    setRepositoryIds(mapping.repositories.map((repo) => repo.id));
                    setEnabled(mapping.enabled);
                    setTargetBranch(mapping.targetBranch ?? '');
                    setViewers(mapping.viewers ?? []);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="text-button" onClick={() => void onDelete(mapping.id)}>
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
