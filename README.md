# Bitbucket Engineering Dashboard for Jira Cloud

## Goal
Build a Jira Cloud Forge app with a custom React UI that shows Bitbucket Cloud engineering analytics.

## MVP
- Workspace/repository selector
- KPI cards: repositories, commits, open PRs, merged PRs, failed/successful pipelines, deployments
- PR table with status, author, reviewers, source/target, dates, Jira key
- Commit activity chart
- Pipeline/build health
- Deployment list by environment
- Developer activity
- Date/repository filters
- Links to Bitbucket and Jira

## Stack
- Atlassian Forge
- Custom UI + React
- Forge backend resolvers
- `@forge/api` `requestBitbucket`
- Atlassian/Forge OAuth and least-privilege scopes
- No exposed Bitbucket credentials in browser
- Add persistence only when historical metrics are required

## Key constraint
Do not assume every Bitbucket API endpoint is available to Forge apps. Check the current Bitbucket API reference and endpoint Forge-scope support before implementation.

## Official references
- https://developer.atlassian.com/platform/forge/getting-started/
- https://developer.atlassian.com/platform/forge/build-a-custom-ui-app-in-jira/
- https://developer.atlassian.com/platform/forge/apis-reference/fetch-api-product.requestbitbucket/
- https://developer.atlassian.com/cloud/bitbucket/rest/

## Development
```bash
npm run install:all
npm test
npm run build
forge login
forge register
forge deploy
forge install
```

The Jira Cloud page is `Bitbucket Engineering` (`jira:globalPage`). Custom UI lives in `static/dashboard`. Forge resolvers live in `src`. Bitbucket credentials stay on the backend.

Phase 2 uses `api.asUser().requestBitbucket` with `read:workspace:bitbucket` and `read:repository:bitbucket`. After deploy, install the app on Jira. The first Bitbucket call will ask the user to grant access. If install requires a Bitbucket workspace as well, run `forge install` for Bitbucket too.
