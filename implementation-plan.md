# Implementation Plan

## Phase 0 — Bootstrap
- install latest Forge CLI
- authenticate
- create Jira Forge app
- choose Custom UI
- deploy development environment
- install on test Jira site

## Phase 1 — Shell
- Jira page/module
- React app
- navigation
- filter bar
- loading/error states

## Phase 2 — Bitbucket connection
- resolve workspace
- list repositories
- repository selector
- verify one repository call

## Phase 3 — PRs
- fetch PRs
- normalize
- table
- status/author filters
- Bitbucket links
- Jira-key links

## Phase 4 — Commits
- recent commits
- activity chart
- author breakdown

## Phase 5 — Pipelines
- latest runs
- success/failure
- duration
- branch/commit links

## Phase 6 — Deployments
- environments
- status
- latest deployments

## Phase 7 — Dashboard KPIs
- aggregate all sections
- calculate summary
- add refresh and last-updated

## Phase 8 — Performance
- pagination
- bounded concurrency
- caching
- partial failure handling

## Phase 9 — Historical analytics
Only if required:
- scheduled sync
- storage
- daily aggregates
- 7/30/90-day trends

## Phase 10 — Production
- permission review
- security review
- error monitoring
- production deployment
- documentation
