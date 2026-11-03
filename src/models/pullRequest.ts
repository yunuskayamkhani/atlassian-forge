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
  reviewers: string[];
  jiraKeys: string[];
};
