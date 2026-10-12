# Bitbucket API Plan

Use Forge `requestBitbucket` from backend code.

## First endpoints to verify
- Workspace/repositories
- Repository branches
- Repository commits
- Repository pull requests
- Repository pipelines
- Repository deployments

Use the current Bitbucket Cloud REST reference for exact paths, parameters, pagination and Forge availability.

## Request pattern
```ts
import api, { route } from "@forge/api";

const res = await api.asApp().requestBitbucket(
  route`/2.0/repositories/${workspaceId}/${repoSlug}/pullrequests?state=OPEN`
);

if (!res.ok) throw new Error(`Bitbucket API: ${res.status}`);
const data = await res.json();
```

## Important
`requestBitbucket` uses `workspaceId`, not the workspace slug, in its route.

## Pagination
Implement one shared helper:
```ts
async function getAllPages<T>(firstUrl: string): Promise<T[]> {
  // follow Bitbucket `next` links until absent
}
```

Add a safety limit so one dashboard request cannot fetch unbounded data.

## Jira linking
Extract Jira keys from:
- branch names
- commit messages
- PR titles/descriptions

Do not assume every item has a Jira key.

## Metrics
MVP metrics are calculated from fetched/normalized data.
Historical metrics require persistence/scheduled sync.

## Rate limits
- batch requests where possible
- cache short-lived reads
- show partial results if one data source fails
- surface 429 as a retryable error
