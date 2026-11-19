import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeploymentTable } from './DeploymentTable';

vi.mock('../state/DashboardData', () => ({
  useDashboardData: () => ({
    deployments: {
      status: 'loaded',
      deployments: [
        {
          uuid: 'deployment-1',
          environment: 'Production',
          status: 'COMPLETED',
          commitHash: '0123456789abcdef',
          createdOn: '2026-11-18T10:00:00Z',
          webUrl: 'https://bitbucket.org/workspace/repo/pipelines/results/1',
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

describe('DeploymentTable', () => {
  it('shows deployment environment, status, commit, repository, and link', () => {
    render(<DeploymentTable />);

    const row = screen.getByRole('row', { name: /Production COMPLETED 0123456 workspace\/repo/ });
    expect(within(row).getByText('Production')).toBeInTheDocument();
    expect(within(row).getByText('COMPLETED')).toBeInTheDocument();
    expect(within(row).getByText('0123456')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'View' })).toBeInTheDocument();
  });
});
