export type Workspace = {
  id: string;
  slug: string;
  name: string;
};

export type Repository = {
  id: string;
  name: string;
  fullName: string;
  workspace: string;
  mainBranch?: string;
  webUrl: string;
};

export type JiraProject = {
  id: string;
  key: string;
  name: string;
};

export type AppUser = {
  accountId: string;
  displayName: string;
};

export type MappedRepository = {
  id: string;
  name: string;
  fullName: string;
};

export type SprintMode = 'none' | 'active' | 'selected';

export type JiraBoard = {
  id: string;
  name: string;
  type: string;
};

export type JiraSprint = {
  id: string;
  name: string;
  state: string;
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
  targetBranch?: string;
  viewers: AppUser[];
};

export type AccessContext = {
  connected: boolean;
  isAdmin: boolean;
  currentAccountId: string;
  mappings: ProjectMapping[];
  jiraProjects: JiraProject[];
  admins: AppUser[];
};

export type JiraStatus = {
  name: string;
  category: string;
};

export type Commit = {
  hash: string;
  shortHash: string;
  message: string;
  jiraKeys: string[];
  author: string;
  date: string;
  webUrl: string;
};

export type PipelineRun = {
  uuid: string;
  buildNumber: number | null;
  status: string;
  branch: string;
  commitHash: string;
  trigger: string;
  createdOn: string;
  completedOn: string;
  buildSeconds: number | null;
  webUrl: string;
  repositoryName?: string;
};

export type Deployment = {
  uuid: string;
  environment: string;
  status: string;
  commitHash: string;
  createdOn: string;
  webUrl: string;
  repositoryName?: string;
};

export type PullRequestState = 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';

export type PullRequest = {
  id: string;
  title: string;
  state: PullRequestState;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  createdOn: string;
  updatedOn: string;
  webUrl: string;
  declinedBy: string;
  reviewers: string[];
  approvedReviewers: string[];
  jiraKeys: string[];
};

export type FailureResult = {
  ok: false;
  status: number;
  message: string;
  retryable: boolean;
};

export type SuccessResult<T> = {
  ok: true;
  data: T;
};

export type Result<T> = SuccessResult<T> | FailureResult;
