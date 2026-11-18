import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PRTable } from './PRTable';

vi.mock('../state/DashboardData', () => ({
  useDashboardData: () => ({
    pullRequests: {
      status: 'loaded',
      pullRequests: [
        {
          id: '42',
          title: 'Add booking confirmation',
          state: 'OPEN',
          author: 'Avery Developer',
          sourceBranch: 'feature/PICO-123-booking',
          targetBranch: 'main',
          createdOn: '2026-11-01T10:00:00.000Z',
          updatedOn: '2026-11-08T10:00:00.000Z',
          webUrl: 'https://bitbucket.org/example/repo/pull-requests/42',
          declinedBy: '',
          reviewers: ['Jordan Reviewer'],
          approvedReviewers: ['Jordan Approver'],
          jiraKeys: ['PICO-123']
        },
        {
          id: '43',
          title: 'Declined change',
          state: 'DECLINED',
          author: 'Casey Developer',
          sourceBranch: 'feature/declined',
          targetBranch: 'main',
          createdOn: '2026-11-02T10:00:00.000Z',
          updatedOn: '2026-11-09T10:00:00.000Z',
          webUrl: 'https://bitbucket.org/example/repo/pull-requests/43',
          declinedBy: 'Taylor Decliner',
          reviewers: ['Jordan Reviewer'],
          approvedReviewers: ['Jordan Approver'],
          jiraKeys: []
        }
      ],
      message: null,
      retryable: false,
      reload: () => undefined
    }
  })
}));

vi.mock('../state/useJiraStatuses', () => ({
  useJiraStatuses: () => ({ 'PICO-123': { name: 'In Progress', category: 'indeterminate' } })
}));

vi.mock('../util/openLink', () => ({
  openLink: () => Promise.resolve()
}));

describe('PRTable', () => {
  it('shows the requested columns first and retains other non-branch columns', () => {
    render(<PRTable />);

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'PR Number',
      'Jira Ticket Number',
      'Jira Status',
      'PR Message',
      'Developer',
      'Status',
      'Reviewers',
      'Updated'
    ]);

    const row = screen.getByRole('row', {
      name: /#42 PICO-123 In Progress Add booking confirmation Avery Developer OPEN Jordan Approver/
    });
    expect(within(row).getByRole('button', { name: '#42' })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'PICO-123' })).toBeInTheDocument();
    expect(within(row).getByText('In Progress')).toBeInTheDocument();
    expect(within(row).getByText('Avery Developer')).toBeInTheDocument();
    expect(within(row).queryByText('Jordan Reviewer')).not.toBeInTheDocument();
    expect(within(row).queryByText('feature/PICO-123-booking')).not.toBeInTheDocument();
    expect(within(row).queryByText('main')).not.toBeInTheDocument();
    const declinedRow = screen.getByRole('row', {
      name: /#43 .* Declined change Casey Developer DECLINED Jordan Approver, Taylor Decliner/
    });
    expect(within(declinedRow).getByText('Jordan Approver, Taylor Decliner')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Source' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Destination' })).not.toBeInTheDocument();
  });
});
