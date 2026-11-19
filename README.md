# Bitbucket Engineering Dashboard for Jira Cloud

## Goal
Build a Jira Cloud Forge app with a custom React UI that shows Bitbucket Cloud engineering analytics.

## MVP
- Workspace/repository selector
- KPI cards: repositories, commits, open PRs, merged PRs, failed/successful pipelines, deployments
- PR table with PR number, Jira reference number, PR message, developer, status, reviewers, and updated date
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

Project access can optionally select a destination branch from the selected Bitbucket repositories. Branch options are loaded from repository branches, so they are available even if a branch has no pull requests yet. When selected, the dashboard shows pull requests targeting that branch and commits associated with those pull requests; no Jira sprint lookup is used for this filter.

The dashboard connects to Bitbucket with an Atlassian API token stored encrypted in Forge. The token must have `read:workspace:bitbucket`, `read:repository:bitbucket`, and `read:pullrequest:bitbucket` scopes. To load pipeline health and Bitbucket deployment history, also grant `read:pipeline:bitbucket`. Deployment rows appear only when Bitbucket has recorded deployments; a pipeline run by itself is not a deployment record. The account that owns the token must also have access to the mapped Bitbucket repositories.

## Push changes to the existing GitHub repository

Create a feature branch, review the files you are about to stage, commit, then push the branch to `origin`:

```bash
git status
git switch -c feature/bitbucket-destination-branch
git add README.md src static/dashboard/src
git diff --cached
git commit -m "Filter dashboard data by Bitbucket destination branch"
git push -u origin feature/bitbucket-destination-branch
```

Open a pull request on GitHub to merge the branch into the repository's main branch. If you have unrelated changes, do not stage the entire folders above; stage only the intended files and review `git diff --cached` before committing.
