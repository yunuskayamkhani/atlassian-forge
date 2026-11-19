import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../api/commits', () => ({ fetchCommits: vi.fn(async () => ({ ok: true, data: [] })) }));
vi.mock('../api/pullRequests', () => ({
  fetchPullRequests: vi.fn(async () => ({ ok: true, data: [] }))
}));
vi.mock('../api/pipelines', () => ({
  fetchPipelines: vi.fn(async () => ({ ok: true, data: [] }))
}));
vi.mock('../api/deployments', () => ({
  fetchDeployments: vi.fn(async () => ({ ok: true, data: [] }))
}));

import { fetchCommits } from '../api/commits';
import { fetchPullRequests } from '../api/pullRequests';
import { fetchPipelines } from '../api/pipelines';
import { fetchDeployments } from '../api/deployments';
import { DashboardDataProvider, useDashboardData } from './DashboardData';
import { FilterProvider } from './FilterContext';

function DataState() {
  const { commits, pullRequests, pipelines, deployments } = useDashboardData();
  return (
    <>
      <p>
        {commits.status}/{pullRequests.status}
      </p>
      <p>{pullRequests.pullRequests.map((pr) => pr.title).join(',')}</p>
      <p>{pullRequests.message}</p>
      <p>{pipelines.status}</p>
      <p>{pipelines.runs.map((run) => `${run.repositoryName}:${run.buildNumber}`).join(',')}</p>
      <p>{deployments.status}</p>
      <p>{deployments.deployments.map((deployment) => `${deployment.repositoryName}:${deployment.environment}`).join(',')}</p>
    </>
  );
}

describe('DashboardDataProvider', () => {
  it('loads data for every mapped repository when All is selected', async () => {
    const repositories = ['repo-1', 'repo-2'].map((id) => ({
      id,
      name: id,
      fullName: `workspace/${id}`,
      workspace: 'workspace-1',
      webUrl: ''
    }));

    render(
      <FilterProvider
        initialFilters={{
          projectId: 'project-1',
          workspaceId: 'workspace-1',
          repositoryId: 'ALL',
          dateRange: '7d',
          prStatus: 'ALL',
          developer: 'ALL',
          environment: 'ALL'
        }}
      >
        <DashboardDataProvider repositories={repositories}>
          <DataState />
        </DashboardDataProvider>
      </FilterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('loaded/loaded')).toBeInTheDocument();
    });

    for (const repositoryId of ['repo-1', 'repo-2']) {
      expect(fetchCommits).toHaveBeenCalledWith('workspace-1', repositoryId, 'ALL', expect.any(Number));
      expect(fetchPullRequests).toHaveBeenCalledWith('workspace-1', repositoryId, 'ALL');
      expect(fetchPipelines).toHaveBeenCalledWith('workspace-1', repositoryId);
      expect(fetchDeployments).toHaveBeenCalledWith('workspace-1', repositoryId);
    }
  });

  it('shows pull requests from accessible repositories when another repository fails', async () => {
    vi.mocked(fetchPullRequests).mockImplementation(async (_workspaceId, repositoryId) =>
      repositoryId === 'repo-1'
        ? {
            ok: true,
            data: [
              {
                id: '1',
                title: 'Visible pull request',
                state: 'OPEN',
                author: 'user',
                sourceBranch: 'feature',
                targetBranch: 'main',
                createdOn: '',
                updatedOn: '',
                webUrl: '',
                declinedBy: '',
                reviewers: [],
                approvedReviewers: [],
                jiraKeys: []
              }
            ]
          }
        : {
            ok: false,
            status: 403,
            message: 'You do not have permission to view this Bitbucket data.',
            retryable: false
          }
    );

    const repositories = ['repo-1', 'repo-2'].map((id) => ({
      id,
      name: id,
      fullName: `workspace/${id}`,
      workspace: 'workspace-1',
      webUrl: ''
    }));

    render(
      <FilterProvider
        initialFilters={{
          projectId: 'project-1',
          workspaceId: 'workspace-1',
          repositoryId: 'ALL',
          dateRange: '7d',
          prStatus: 'ALL',
          developer: 'ALL',
          environment: 'ALL'
        }}
      >
        <DashboardDataProvider repositories={repositories}>
          <DataState />
        </DashboardDataProvider>
      </FilterProvider>
    );

    expect(await screen.findByText('loaded/partial')).toBeInTheDocument();
    expect(screen.getByText('Visible pull request')).toBeInTheDocument();
    expect(screen.getByText(/Some repositories could not be loaded/)).toBeInTheDocument();
  });

  it('sorts pull requests by descending PR number across repositories', async () => {
    vi.mocked(fetchPullRequests).mockImplementation(async (_workspaceId, repositoryId) => ({
      ok: true,
      data: [
        {
          id: repositoryId === 'repo-1' ? '8' : '12',
          title: repositoryId === 'repo-1' ? 'Older PR' : 'Latest PR',
          state: 'OPEN',
          author: 'user',
          sourceBranch: 'feature',
          targetBranch: 'main',
          createdOn: '',
          updatedOn: '',
          webUrl: '',
          declinedBy: '',
          reviewers: [],
          approvedReviewers: [],
          jiraKeys: []
        }
      ]
    }));

    const repositories = ['repo-1', 'repo-2'].map((id) => ({
      id,
      name: id,
      fullName: `workspace/${id}`,
      workspace: 'workspace-1',
      webUrl: ''
    }));

    render(
      <FilterProvider
        initialFilters={{
          projectId: 'project-1',
          workspaceId: 'workspace-1',
          repositoryId: 'ALL',
          dateRange: '7d',
          prStatus: 'ALL',
          developer: 'ALL',
          environment: 'ALL'
        }}
      >
        <DashboardDataProvider repositories={repositories}>
          <DataState />
        </DashboardDataProvider>
      </FilterProvider>
    );

    expect(await screen.findByText('Latest PR,Older PR')).toBeInTheDocument();
  });

  it('loads pipelines from every mapped repository and sorts newest first', async () => {
    vi.mocked(fetchPipelines).mockImplementation(async (_workspaceId, repositoryId) => ({
      ok: true,
      data: [
        {
          uuid: `pipeline-${repositoryId}`,
          buildNumber: repositoryId === 'repo-1' ? 8 : 12,
          status: 'SUCCESSFUL',
          branch: 'main',
          commitHash: 'abc123',
          trigger: 'Push',
          createdOn: repositoryId === 'repo-1' ? '2026-11-18T10:00:00Z' : '2026-11-19T10:00:00Z',
          completedOn: '2026-11-19T10:05:00Z',
          buildSeconds: 300,
          webUrl: ''
        }
      ]
    }));

    const repositories = ['repo-1', 'repo-2'].map((id) => ({
      id,
      name: id,
      fullName: `workspace/${id}`,
      workspace: 'workspace-1',
      webUrl: ''
    }));

    render(
      <FilterProvider
        initialFilters={{
          projectId: 'project-1',
          workspaceId: 'workspace-1',
          repositoryId: 'ALL',
          dateRange: '90d',
          prStatus: 'ALL',
          developer: 'ALL',
          environment: 'ALL'
        }}
      >
        <DashboardDataProvider repositories={repositories}>
          <DataState />
        </DashboardDataProvider>
      </FilterProvider>
    );

    expect(await screen.findByText('workspace/repo-2:12,workspace/repo-1:8')).toBeInTheDocument();
  });

  it('loads deployments from every mapped repository and sorts newest first', async () => {
    vi.mocked(fetchDeployments).mockImplementation(async (_workspaceId, repositoryId) => ({
      ok: true,
      data: [
        {
          uuid: `deployment-${repositoryId}`,
          environment: 'Production',
          status: 'COMPLETED',
          commitHash: 'abc123',
          createdOn: repositoryId === 'repo-1' ? '2026-11-18T10:00:00Z' : '2026-11-19T10:00:00Z',
          webUrl: ''
        }
      ]
    }));

    const repositories = ['repo-1', 'repo-2'].map((id) => ({
      id,
      name: id,
      fullName: `workspace/${id}`,
      workspace: 'workspace-1',
      webUrl: ''
    }));

    render(
      <FilterProvider
        initialFilters={{
          projectId: 'project-1',
          workspaceId: 'workspace-1',
          repositoryId: 'ALL',
          dateRange: '90d',
          prStatus: 'ALL',
          developer: 'ALL',
          environment: 'ALL'
        }}
      >
        <DashboardDataProvider repositories={repositories}>
          <DataState />
        </DashboardDataProvider>
      </FilterProvider>
    );

    expect(await screen.findByText('workspace/repo-2:Production,workspace/repo-1:Production')).toBeInTheDocument();
  });
});
