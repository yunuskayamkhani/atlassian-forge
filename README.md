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

The Jira project page is `Bitbucket Engineering` (`jira:projectPage`). Admin mapping is restricted to the Jira project `PICO`, the Bitbucket workspace `owaismasoodq3`, and the `awc_bookingflow_web` and `awc_bookingflow_api` repositories. Bitbucket data is available only to users explicitly listed in the mapping's viewer list; an empty list grants access to nobody, including dashboard admins. Custom UI lives in `static/dashboard`. Forge resolvers live in `src`. Bitbucket credentials stay on the backend.

The dashboard connects to Bitbucket with an Atlassian API token stored encrypted in Forge. The token must have `read:workspace:bitbucket`, `read:repository:bitbucket`, and `read:pullrequest:bitbucket` scopes. The account that owns the token must also have access to the mapped Bitbucket repositories.
