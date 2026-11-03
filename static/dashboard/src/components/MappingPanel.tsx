import { useEffect, useRef, useState } from 'react';
import { fetchBoards, fetchSprints } from '../api/access';
import { UserPicker } from './UserPicker';
import type { AppUser, JiraBoard, JiraProject, JiraSprint, ProjectMapping, Repository, SprintMode, Workspace } from '../types/models';

function sprintSummary(mapping: ProjectMapping): string {
  if (mapping.sprintMode === 'active') {
    return mapping.sprintName ? `active sprint: ${mapping.sprintName}` : 'active sprint';
  }
  if (mapping.sprintMode === 'selected') {
    return mapping.sprintName || 'selected sprint';
  }
  return 'all activity';
}

export function MappingPanel({
  mappings,
  jiraProjects,
  workspaces,
  onLoadRepositories,
  onSave,
  onDelete
}: {
  mappings: ProjectMapping[];
  jiraProjects: JiraProject[];
  workspaces: Workspace[];
  onLoadRepositories: (workspaceId: string) => Promise<Repository[]>;
  onSave: (mapping: Omit<ProjectMapping, 'id'> & { id?: string }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [projectId, setProjectId] = useState(jiraProjects[0]?.id ?? '');
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? '');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [repositoryIds, setRepositoryIds] = useState<string[]>([]);
  const pendingRepositoryIds = useRef<string[] | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [sprintMode, setSprintMode] = useState<SprintMode>('none');
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [boardId, setBoardId] = useState('');
  const [sprints, setSprints] = useState<JiraSprint[]>([]);
  const [sprintId, setSprintId] = useState('');
  const [sprintError, setSprintError] = useState<string | null>(null);
  const [viewers, setViewers] = useState<AppUser[]>([]);
  const [saving, setSaving] = useState(false);

  const project = jiraProjects.find((item) => item.id === projectId);
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const selectedRepositories = repos.filter((item) => repositoryIds.includes(item.id));
  const board = boards.find((item) => item.id === boardId);
  const sprint = sprints.find((item) => item.id === sprintId);
  const sprintOptions = sprintMode === 'active' ? sprints.filter((item) => item.state === 'active') : sprints;

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
    if (!project?.key || sprintMode === 'none') {
      setBoards([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await fetchBoards(project.key);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setSprintError(result.message);
        setBoards([]);
        return;
      }
      setSprintError(null);
      setBoards(result.data);
      setBoardId((current) => current || result.data[0]?.id || '');
    })();

    return () => {
      cancelled = true;
    };
  }, [project?.key, sprintMode]);

  useEffect(() => {
    if (!boardId || sprintMode === 'none') {
      setSprints([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await fetchSprints(boardId);
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setSprintError(result.message);
        setSprints([]);
        return;
      }
      setSprintError(null);
      setSprints(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, sprintMode]);

  return (
    <section className="connect-card" aria-labelledby="mapping-title">
      <h2 id="mapping-title">Project access</h2>
      <p>
        Map a Jira project to a Bitbucket repository, choose the board and sprint, then pick who can view it.
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
            sprintMode,
            boardId: sprintMode === 'none' ? '' : board?.id || boardId,
            boardName: sprintMode === 'none' ? '' : board?.name || '',
            sprintId: sprintMode === 'none' ? '' : sprint?.id || sprintId,
            sprintName: sprintMode === 'none' ? '' : sprint?.name || '',
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
              setBoardId('');
              setSprintId('');
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
                onChange={(event) =>
                  setRepositoryIds((current) =>
                    event.target.checked
                      ? [...current, item.id]
                      : current.filter((id) => id !== item.id)
                  )
                }
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
          <span>Client sprint</span>
          <select
            value={sprintMode}
            onChange={(event) => setSprintMode(event.target.value as SprintMode)}
            aria-label="Client sprint"
          >
            <option value="none">All activity (no sprint filter)</option>
            <option value="active">Active sprint on a board</option>
            <option value="selected">A specific sprint</option>
          </select>
        </label>
        {sprintMode !== 'none' ? (
          <>
            <label className="filter-field">
              <span>Jira board</span>
              <select
                value={boardId}
                onChange={(event) => {
                  setBoardId(event.target.value);
                  setSprintId('');
                }}
                aria-label="Jira board"
                required
              >
                <option value="">Select board</option>
                {boards.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span>{sprintMode === 'active' ? 'Client sprint if two are active' : 'Sprint'}</span>
              <select
                value={sprintId}
                onChange={(event) => setSprintId(event.target.value)}
                aria-label="Jira sprint"
                required={sprintMode === 'selected' || sprintOptions.length > 1}
              >
                <option value="">{sprintMode === 'active' ? 'Use the only active sprint' : 'Select sprint'}</option>
                {sprintOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.state === 'active' ? ' (active)' : item.state === 'future' ? ' (future)' : ' (closed)'}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <p className="muted">
          When two sprints run in parallel, pick the one the client should see. Pull requests and commits without a
          matching Jira key in that sprint are hidden.
        </p>
        {sprintError ? <p className="connect-error">{sprintError}</p> : null}
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
                {` (${sprintSummary(mapping)})`}
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
                    setSprintMode(mapping.sprintMode || 'none');
                    setBoardId(mapping.boardId);
                    setSprintId(mapping.sprintId);
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
