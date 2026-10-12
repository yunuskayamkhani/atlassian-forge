# Coding Rules

## General
- TypeScript preferred.
- Small modules; single responsibility.
- No duplicated API logic.
- No raw Bitbucket responses in React components.
- Strong types for normalized models.
- Handle null/missing fields.
- Keep functions short.

## API
- One service per Bitbucket resource.
- Centralize request/error handling.
- Centralize pagination.
- Use bounded concurrency.
- Never expose tokens.
- Respect API rate limits.

## React
- Components: Dashboard, Filters, KPIGrid, PRTable, CommitChart, PipelineTable, DeploymentTable, DeveloperTable.
- Fetch through a data/service layer.
- Avoid unnecessary re-renders.
- Keep filters in one state model.

## UX
- skeleton while loading
- empty state when no data
- retry for transient failures
- clear permission error
- accessible labels
- mobile-safe tables

## Testing
Test:
- API pagination
- empty results
- 401/403
- 404
- 429
- malformed/missing fields
- Jira key extraction
- metric calculations
- filter behavior

## Git
Branch:
`feature/<JIRA-KEY>-short-description`

Commit:
`<JIRA-KEY> Short description`

PR:
`<JIRA-KEY> Short description`
