import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('@forge/bridge', () => ({
  invoke: vi.fn(),
  view: {
    getContext: vi.fn(async () => ({ extension: { project: { key: 'SCRUM' } } }))
  }
}));

import { invoke, view } from '@forge/bridge';

const mockedInvoke = vi.mocked(invoke);
const mockedGetContext = vi.mocked(view.getContext);

beforeEach(() => {
  mockedGetContext.mockResolvedValue({
    extension: { project: { key: 'PICO' } },
    environmentId: '',
    environmentType: 'STAGING',
    localId: '',
    locale: 'en-US',
    moduleKey: '',
    siteUrl: '',
    timezone: ''
  });
});

const mapping = {
  id: '10000',
  enabled: true,
  projectId: '10000',
  projectKey: 'PICO',
  projectName: 'Scrum',
  workspaceId: '{470c176d-3574-44ea-bb41-89e8638bcca4}',
  workspaceName: 'Acme',
  repositories: [
    {
      id: '{11111111-1111-1111-1111-111111111111}',
      name: 'awc_bookingflow_web',
      fullName: 'owaismasoodq3/awc_bookingflow_web'
    }
  ],
  sprintMode: 'none',
  boardId: '',
  boardName: '',
  sprintId: '',
  sprintName: '',
  viewers: [{ accountId: 'test-account', displayName: 'Test User' }]
};

describe('App shell', () => {
  it('shows a loading skeleton while the backend is contacted', () => {
    mockedInvoke.mockReturnValue(new Promise(() => undefined));
    render(<App />);
    expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument();
  });

  it('renders the approved project and repositories after Bitbucket is connected', async () => {
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return {
          ok: true,
          data: {
            connected: true,
            isAdmin: true,
            currentAccountId: 'test-account',
            mappings: [mapping],
            jiraProjects: [{ id: '10000', key: 'PICO', name: 'Pico' }],
            admins: []
          }
        };
      }
      if (key === 'getWorkspaces') {
        return { ok: true, data: [{ id: mapping.workspaceId, slug: 'owaismasoodq3', name: 'Owais Masood' }] };
      }
      if (key === 'getRepositories') {
        return {
          ok: true,
          data: [
            {
              id: mapping.repositories[0].id,
              name: 'awc_bookingflow_web',
              fullName: 'owaismasoodq3/awc_bookingflow_web'
            },
            {
              id: '{22222222-2222-2222-2222-222222222222}',
              name: 'awc_bookingflow_api',
              fullName: 'owaismasoodq3/awc_bookingflow_api'
            }
          ]
        };
      }
      return { ok: true, data: [] };
    });

    render(<App />);

    expect(await screen.findByText('BITBUCKET ENGINEERING')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Jira project' })).toHaveValue(mapping.projectId);
    expect(await screen.findByRole('checkbox', { name: 'owaismasoodq3/awc_bookingflow_web' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'owaismasoodq3/awc_bookingflow_api' })).toBeInTheDocument();
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
            currentAccountId: 'test-account',
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

  it('does not show Bitbucket data to an admin when the viewer list is empty', async () => {
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return {
          ok: true,
          data: {
            connected: true,
            isAdmin: true,
            currentAccountId: 'test-account',
            mappings: [{ ...mapping, viewers: [] }],
            jiraProjects: [{ id: '10000', key: 'PICO', name: 'Pico' }],
            admins: []
          }
        };
      }
      if (key === 'getWorkspaces') {
        return { ok: true, data: [{ id: mapping.workspaceId, slug: 'owaismasoodq3', name: 'Owais Masood' }] };
      }
      return { ok: true, data: [] };
    });

    render(<App />);

    expect(await screen.findByText('This project is not enabled')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project access' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Jira project' })).not.toBeInTheDocument();
    expect(screen.getByText(/leaving this list empty grants access to nobody/i)).toBeInTheDocument();
  });

  it('does not show mapped dashboard data in a different Jira project', async () => {
    mockedGetContext.mockResolvedValue({
      extension: { project: { key: 'OTHER' } },
      environmentId: '',
      environmentType: 'STAGING',
      localId: '',
      locale: 'en-US',
      moduleKey: '',
      siteUrl: '',
      timezone: ''
    });
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return {
          ok: true,
          data: {
            connected: true,
            isAdmin: false,
            currentAccountId: 'other-account',
            mappings: [mapping],
            jiraProjects: [],
            admins: []
          }
        };
      }
      return { ok: true, data: [] };
    });

    render(<App />);

    expect(await screen.findByText('This project is not enabled')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Jira project' })).not.toBeInTheDocument();
  });

  it('asks an administrator to connect Bitbucket when no credentials are stored', async () => {
    mockedInvoke.mockImplementation(async (key: string) => {
      if (key === 'getAccessContext') {
        return {
          ok: true,
          data: { connected: false, isAdmin: true, currentAccountId: 'test-account', mappings: [], jiraProjects: [] }
        };
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
        return {
          ok: true,
          data: { connected: false, isAdmin: false, currentAccountId: 'test-account', mappings: [], jiraProjects: [] }
        };
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
