# Architecture

```text
Jira Cloud
  |
  | Forge app
  v
Custom UI (React)
  |
  | invoke()
  v
Forge resolvers
  |
  | requestBitbucket()
  v
Bitbucket Cloud REST API
  |
  +-- repositories
  +-- branches
  +-- commits
  +-- pull requests
  +-- pipelines/builds
  +-- deployments
```

## Rules
1. UI never stores Bitbucket secrets/tokens.
2. API calls go through Forge backend unless an official bridge method is explicitly appropriate.
3. Validate all user-controlled workspace/repository/filter values.
4. Use least-privilege Forge scopes.
5. Paginate every Bitbucket collection.
6. Cache/reuse data where practical; do not fetch an entire workspace on every render.
7. Normalize API responses before sending them to the UI.
8. Handle Bitbucket rate limits, 401/403, 404 and 429 explicitly.
9. Keep UI independent from raw Bitbucket response shapes.
10. Design for multiple repositories from day one.

## UI
Use Custom UI, not UI Kit, because the dashboard needs charts, tables, filters and full visual control.

## Optional historical layer
For trends across long periods:
Bitbucket -> scheduled Forge sync -> Forge Storage/external DB -> analytics resolver -> UI.

Do not add a database until MVP requirements prove it is needed.
