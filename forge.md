# Forge Implementation

## Recommended modules
- Jira global/page module for the dashboard
- Custom UI resource                                    
- Resolver functions
- Optional scheduled trigger for historical sync
- Optional storage layer

## UI -> backend
Use Forge bridge `invoke()` for resolver calls.

Example:
```ts
import { invoke } from "@forge/bridge";

const data = await invoke("getDashboard", {
  workspaceId,
  repoSlug,
  from,
  to
});
```

## Backend
Resolvers should:
1. validate input
2. authorize/verify context as needed
3. call Bitbucket
4. normalize data
5. calculate requested metrics
6. return only fields needed by UI

## Manifest
Declare only required Jira/Bitbucket scopes and modules.
Do not copy a guessed scope list from an old example. Check the current Forge and Bitbucket documentation.

## Security
- least privilege
- no secrets in frontend
- no credentials committed to Git
- validate repository/workspace identifiers
- never trust client-supplied authorization decisions

## Environments
Use:
- development
- staging
- production

Test with a Jira Cloud site before production.

## Current platform notes
Forge supports Custom UI for full frontend control.
Forge provides `requestBitbucket` for supported Bitbucket REST operations.
Bitbucket API documentation marks which endpoints are available to Forge apps.
