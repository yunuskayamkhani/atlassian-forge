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
  targetBranch: '',
  viewers: []
};

describe('clientSprintLabel', () => {
  it('hides the label when all destination branches are visible', () => {
    expect(clientSprintLabel(mapping)).toBeNull();
  });

  it('describes the selected Bitbucket destination branch', () => {
    expect(clientSprintLabel({ ...mapping, targetBranch: 'Sprint-67/Development_Sprint-67' })).toBe(
      'Showing destination branch: Sprint-67/Development_Sprint-67'
    );
  });
});
