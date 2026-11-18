import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MappingPanel } from './MappingPanel';
import type { ProjectMapping } from '../types/models';

const mapping: ProjectMapping = {
  id: 'project-1',
  enabled: true,
  projectId: 'project-1',
  projectKey: 'PICO',
  projectName: 'Pico',
  workspaceId: 'workspace-1',
  workspaceName: 'Owais',
  repositories: [
    { id: 'repo-1', name: 'API', fullName: 'workspace/api' },
    { id: 'repo-2', name: 'Web', fullName: 'workspace/web' }
  ],
  sprintMode: 'none',
  boardId: '',
  boardName: '',
  sprintId: '',
  sprintName: '',
  targetBranch: 'Sprint-67/Development_Sprint-67',
  viewers: [{ accountId: 'viewer-1', displayName: 'Yunus Kayamkhani' }]
};

describe('MappingPanel', () => {
  it('loads Bitbucket destination branches and preselects the saved branch', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => true);
    render(
      <MappingPanel
        mappings={[mapping]}
        jiraProjects={[{ id: 'project-1', key: 'PICO', name: 'Pico' }]}
        workspaces={[{ id: 'workspace-1', slug: 'workspace', name: 'Owais' }]}
        onLoadRepositories={async () => [
          {
            id: 'repo-1',
            name: 'API',
            fullName: 'workspace/api',
            workspace: 'workspace-1',
            webUrl: ''
          },
          {
            id: 'repo-2',
            name: 'Web',
            fullName: 'workspace/web',
            workspace: 'workspace-1',
            webUrl: ''
          }
        ]}
        onLoadTargetBranches={async () => ({
          ok: true,
          data: ['main', 'Sprint-67/Development_Sprint-67']
        })}
        onSave={onSave}
        onDelete={vi.fn(async () => undefined)}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Map Jira project' })).toHaveValue('project-1');
    expect(screen.getByRole('combobox', { name: 'Map Bitbucket workspace' })).toHaveValue('workspace-1');
    expect(screen.getByRole('combobox', { name: 'Pull request destination branch' })).toHaveValue(
      'Sprint-67/Development_Sprint-67'
    );
    expect(screen.getByRole('checkbox', { name: 'Enabled for viewers' })).toBeChecked();
    expect(screen.getByText('Yunus Kayamkhani')).toBeInTheDocument();

    expect(await screen.findByRole('checkbox', { name: 'workspace/api' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'workspace/web' })).toBeChecked();
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Sprint-67/Development_Sprint-67' })).toBeInTheDocument()
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Pull request destination branch' }),
      'main'
    );
    await user.click(screen.getByRole('button', { name: 'Save mapping' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          targetBranch: 'main',
          sprintMode: 'none'
        })
      )
    );
  });
});
