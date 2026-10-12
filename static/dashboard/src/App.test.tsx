import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('@forge/bridge', () => ({
  invoke: vi.fn()
}));

import { invoke } from '@forge/bridge';

const mockedInvoke = vi.mocked(invoke);

const mapping = {
  id: '10000',
  enabled: true,
  projectId: '10000',
  projectKey: 'SCRUM',
  projectName: 'Scrum',
  workspaceId: '{470c176d-3574-44ea-bb41-89e8638bcca4}',
  workspaceName: 'Acme',
  repositories: [{ id: '{11111111-1111-1111-1111-111111111111}', name: 'payments', fullName: 'acme/payments' }],
  sprintMode: 'none',
  boardId: '',
  boardName: '',
  sprintId: '',
  sprintName: '',
  viewers: []
};

describe('App shell', () => {
  it('shows a loading skeleton while the backend is contacted', () => {
    mockedInvoke.mockReturnValue(new Promise(() => undefined));
    render(<App />);
    expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument();
  });

  it('renders enabled project options after Bitbucket is connected', async () => {
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return {
          ok: true,
          data: {
            connected: true,
            isAdmin: true,
            mappings: [mapping],
            jiraProjects: [{ id: '10000', key: 'SCRUM', name: 'Scrum' }],
            admins: []
          }
        };
      }
      if (key === 'getWorkspaces') {
        return { ok: true, data: [{ id: mapping.workspaceId, slug: 'acme', name: 'Acme' }] };
      }
      return { ok: true, data: [] };
    });

    render(<App />);

    expect(await screen.findByText('BITBUCKET ENGINEERING')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Jira project' })).toHaveValue(mapping.projectId);
    expect(await screen.findByRole('option', { name: 'payments' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project access' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard admins' })).toBeInTheDocument();
  });

  it('hides admin panels from viewers', async () => {
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return {
          ok: true,
          data: {
            connected: true,
            isAdmin: false,
            mappings: [mapping],
            jiraProjects: [],
            admins: []
          }
        };
      }
      return { ok: true, data: [] };
    });

    render(<App />);

    expect(await screen.findByText('BITBUCKET ENGINEERING')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Project access' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard admins' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disconnect Bitbucket' })).not.toBeInTheDocument();
  });

  it('asks an administrator to connect Bitbucket when no credentials are stored', async () => {
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return { ok: true, data: { connected: false, isAdmin: true, mappings: [], jiraProjects: [] } };
      }
      return { ok: true, data: [] };
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Connect Bitbucket' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect Bitbucket' })).toBeInTheDocument();
  });

  it('tells viewers to wait when Bitbucket is not connected', async () => {
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return { ok: true, data: { connected: false, isAdmin: false, mappings: [], jiraProjects: [] } };
      }
      return { ok: true, data: [] };
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Waiting for an administrator' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect Bitbucket' })).not.toBeInTheDocument();
  });

  it('shows an error when the Forge bridge is missing', async () => {
    mockedInvoke.mockRejectedValue(new Error('Unable to establish a connection with the Custom UI bridge.'));

    render(<App />);

    expect(await screen.findByText('Unable to load the dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Open Apps → Bitbucket Engineering/)).toBeInTheDocument();
  });
});
