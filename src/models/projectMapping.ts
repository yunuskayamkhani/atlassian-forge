import type { AppUser } from './appUser';

export type SprintMode = 'none' | 'active' | 'selected';

export type MappedRepository = {
  id: string;
  name: string;
  fullName: string;
};

export type ProjectMapping = {
  id: string;
  enabled: boolean;
  projectId: string;
  projectKey: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  repositories: MappedRepository[];
  sprintMode: SprintMode;
  boardId: string;
  boardName: string;
  sprintId: string;
  sprintName: string;
  viewers: AppUser[];
};
