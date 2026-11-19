import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PipelineTable } from './PipelineTable';

vi.mock('../state/DashboardData', () => ({
  useDashboardData: () => ({
    pipelines: {
      status: 'loaded',
      runs: [
        {
          uuid: 'pipeline-1',
          buildNumber: 21,
          status: 'SUCCESSFUL',
          branch: 'main',
          commitHash: 'abc123',
          trigger: 'Push',
          createdOn: '2026-11-18T12:00:00Z',
          completedOn: '2026-11-18T12:05:00Z',
          buildSeconds: 300,
          webUrl: 'https://bitbucket.org/workspace/repo/addon/pipelines/home#!/results/21',
          repositoryName: 'workspace/repo'
        },
        {
          uuid: 'pipeline-2',
          buildNumber: 20,
          status: 'FAILED',
          branch: 'feature/test',
          commitHash: 'def456',
          trigger: 'Push',
          createdOn: '2026-11-17T12:00:00Z',
          completedOn: '2026-11-17T12:03:00Z',
          buildSeconds: 180,
          webUrl: '',
          repositoryName: 'workspace/repo'
        }
      ],
      message: null,
      retryable: false,
      reload: () => undefined
    }
  })
}));

vi.mock('../util/openLink', () => ({
  openLink: () => Promise.resolve()
}));

describe('PipelineTable', () => {
  it('shows pipeline runs and completed-run health metrics', () => {
    render(<PipelineTable />);

    expect(screen.getAllByText('50%')).toHaveLength(2);
    expect(screen.getAllByText('workspace/repo')).toHaveLength(2);
    expect(screen.getByText('feature/test')).toBeInTheDocument();
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText('5m')).toBeInTheDocument();
    const build = screen.getByRole('button', { name: '#21' });
    expect(build).toBeInTheDocument();
    expect(within(build.closest('tr') as HTMLTableRowElement).getByText('SUCCESSFUL')).toBeInTheDocument();
  });
});
