import { describe, expect, it } from 'vitest';
import { clientSprintLabel } from './clientSprint';
import type { ProjectMapping } from '../types/models';

const mapping: ProjectMapping = {
  id: '10000',
  enabled: true,
  projectId: '10000',
  projectKey: 'SCRUM',
  projectName: 'Scrum',
  workspaceId: '{ws}',
  workspaceName: 'Acme',
  repositories: [{ id: '{repo}', name: 'payments', fullName: 'acme/payments' }],
  sprintMode: 'none',
  boardId: '',
  boardName: '',
  sprintId: '',
  sprintName: '',
  viewers: []
};

describe('clientSprintLabel', () => {
  it('hides the label when all activity is visible', () => {
    expect(clientSprintLabel(mapping)).toBeNull();
  });

  it('describes the active sprint', () => {
    expect(clientSprintLabel({ ...mapping, sprintMode: 'active', sprintName: 'Sprint 12' })).toBe(
      'Showing sprint: Sprint 12 (active)'
    );
  });

  it('describes a specifically selected sprint', () => {
    expect(clientSprintLabel({ ...mapping, sprintMode: 'selected', sprintName: 'Sprint 11' })).toBe(
      'Showing sprint: Sprint 11'
    );
  });
});
