# Product Specification

## Page
`Bitbucket Engineering`

## Header
- Workspace selector
- Repository selector: All / specific
- Date range: 7d / 30d / 90d / custom
- Refresh
- Last updated

## KPI cards
1. Repositories
2. Commits
3. Open PRs
4. Merged PRs
5. PRs needing review
6. Pipeline success %
7. Failed pipelines
8. Deployments

## PR section
Columns:
- ID
- Title
- Status
- Author
- Reviewers
- Source
- Target
- Created
- Updated
- Merged
- Jira key

Actions:
- Filter status
- Filter author
- Filter repository
- Open Bitbucket PR
- Open Jira issue

## Commit section
- commits over time
- commits by repository
- commits by author
- recent commits table

## Pipeline section
- success/failure trend
- latest runs
- duration
- branch
- commit
- repository
- status

## Deployment section
- environment
- status
- commit
- repository
- started/completed
- deployment URL

## Developer section
Metrics:
- commits
- PRs opened
- PRs merged
- PRs reviewed

Do not label raw activity as employee performance.

## UX
- responsive
- loading skeletons
- empty states
- error states
- accessible tables/charts
- no polling faster than necessary
- clear source links
