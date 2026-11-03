import { describe, expect, it, vi } from 'vitest';
import type { ProjectMapping } from '../../models/projectMapping';
import { commitSprintKeys, filterForClientSprint, pullRequestSprintKeys } from './sprintFilter';

vi.mock('./sprints', () => ({
  resolveClientSprint: vi.fn()
}));

import { resolveClientSprint } from './sprints';

const mapping: ProjectMapping = {
  id: '10000',
  enabled: true,
  projectId: '10000',
  projectKey: 'SCRUM',
  projectName: 'Scrum',
  workspaceId: '{ws}',
  workspaceName: 'Acme',
  repositories: [{ id: '{repo}', name: 'payments', fullName: 'acme/payments' }],
  sprintMode: 'selected',
  boardId: '1',
  boardName: 'SCRUM board',
  sprintId: '12',
  sprintName: 'Sprint 12'
};

describe('filterForClientSprint', () => {
  it('returns all items when no sprint filter is configured', async () => {
    vi.mocked(resolveClientSprint).mockResolvedValue(null);
    const items = [{ jiraKeys: ['SCRUM-1'] }, { jiraKeys: [] }];
    await expect(filterForClientSprint(mapping, items, (item) => item.jiraKeys)).resolves.toEqual(items);
  });

  it('keeps only items whose keys are in the selected sprint', async () => {
    vi.mocked(resolveClientSprint).mockResolvedValue({
      sprintId: '12',
      sprintName: 'Sprint 12',
      keys: new Set(['SCRUM-2'])
    });
    const items = [{ jiraKeys: ['SCRUM-1'] }, { jiraKeys: ['SCRUM-2'] }, { jiraKeys: [] }];
    await expect(filterForClientSprint(mapping, items, (item) => item.jiraKeys)).resolves.toEqual([
      { jiraKeys: ['SCRUM-2'] }
    ]);
  });
});

describe('sprint key helpers', () => {
  it('reads keys from a pull request', () => {
    expect(pullRequestSprintKeys({ jiraKeys: ['SCRUM-1'] } as never)).toEqual(['SCRUM-1']);
  });

  it('extracts keys from a commit message', () => {
    expect(commitSprintKeys({ message: 'SCRUM-9 fix cache' } as never)).toEqual(['SCRUM-9']);
  });
});
