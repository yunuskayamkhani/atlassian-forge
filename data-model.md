# Normalized Data Model

## Repository
```ts
type Repository = {
  id: string;
  name: string;
  fullName: string;
  workspace: string;
  mainBranch?: string;
  webUrl: string;
};
```

## Commit
```ts
type Commit = {
  hash: string;
  repositoryId: string;
  author: string;
  message: string;
  timestamp: string;
  branch?: string;
  jiraKeys: string[];
  webUrl: string;
};
```

## PullRequest
```ts
type PullRequest = {
  id: number;
  repositoryId: string;
  title: string;
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED";
  author: string;
  reviewers: string[];
  source: string;
  target: string;
  createdAt: string;
  updatedAt: string;
  mergedAt?: string;
  jiraKeys: string[];
  webUrl: string;
};
```

## Pipeline
```ts
type Pipeline = {
  uuid: string;
  repositoryId: string;
  buildNumber?: number;
  state: string;
  result?: string;
  branch?: string;
  commit?: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  webUrl: string;
};
```

## Deployment
```ts
type Deployment = {
  uuid: string;
  repositoryId: string;
  environment?: string;
  state: string;
  commit?: string;
  startedAt?: string;
  completedAt?: string;
  webUrl?: string;
};
```

## DashboardSummary
```ts
type DashboardSummary = {
  repositories: number;
  commits: number;
  openPRs: number;
  mergedPRs: number;
  reviewPendingPRs: number;
  pipelineSuccessRate?: number;
  failedPipelines: number;
  deployments: number;
};
```

Keep API-specific fields out of UI components.
