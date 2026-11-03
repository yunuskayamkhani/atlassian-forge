import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FilterProvider, useFilters } from '../state/FilterContext';
import { DEFAULT_FILTERS } from '../types/filters';
import { Filters } from './Filters';

const mapping = {
  id: '10000',
  enabled: true,
  projectId: '10000',
  projectKey: 'SCRUM',
  projectName: 'Scrum',
  workspaceId: '{470c176d-3574-44ea-bb41-89e8638bcca4}',
  workspaceName: 'Acme',
  repositories: [{ id: '{11111111-1111-1111-1111-111111111111}', name: 'payments', fullName: 'acme/payments' }],
  sprintMode: 'none' as const,
  boardId: '',
  boardName: '',
  sprintId: '',
  sprintName: '',
  viewers: []
};

const repository = {
  id: '{11111111-1111-1111-1111-111111111111}',
  name: 'payments',
  fullName: 'acme/payments',
  workspace: mapping.workspaceId,
  webUrl: 'https://bitbucket.org/acme/payments'
};

function SelectedRepository() {
  const { filters } = useFilters();
  return <div>Selected repository: {filters.repositoryId}</div>;
}

describe('Filters', () => {
  it('keeps repository selection in shared filter state', async () => {
    const user = userEvent.setup();
    render(
      <FilterProvider initialFilters={{ ...DEFAULT_FILTERS, projectId: mapping.projectId, workspaceId: mapping.workspaceId }}>
        <Filters
          lastUpdated="2026-09-10T10:00:00.000Z"
          isRefreshing={false}
          onRefresh={() => undefined}
          mappings={[mapping]}
          repositories={[repository]}
        />
        <SelectedRepository />
      </FilterProvider>
    );

    await user.selectOptions(screen.getByLabelText('Repository'), repository.id);
    expect(screen.getByText(`Selected repository: ${repository.id}`)).toBeInTheDocument();
  });

  it('shows which sprint the client can see', () => {
    render(
      <FilterProvider
        initialFilters={{ ...DEFAULT_FILTERS, projectId: mapping.projectId, workspaceId: mapping.workspaceId }}
      >
        <Filters
          lastUpdated="2026-09-10T10:00:00.000Z"
          isRefreshing={false}
          onRefresh={() => undefined}
          mappings={[{ ...mapping, sprintMode: 'selected', sprintName: 'Sprint 12' }]}
          repositories={[repository]}
        />
      </FilterProvider>
    );
    expect(screen.getByText('Showing sprint: Sprint 12')).toBeInTheDocument();
  });

  it('disables repository selection until a project is chosen', () => {
    render(
      <FilterProvider>
        <Filters lastUpdated="2026-09-10T10:00:00.000Z" isRefreshing={false} onRefresh={() => undefined} />
      </FilterProvider>
    );
    expect(screen.getByLabelText('Repository')).toBeDisabled();
  });
});
