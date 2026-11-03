# Architecture Decisions

## ADR-001 Custom UI
Use Custom UI instead of UI Kit because the dashboard needs rich charts, tables and custom layout.

## ADR-002 Backend Bitbucket access
Use Forge backend `requestBitbucket` rather than exposing API credentials to the browser.

## ADR-003 No database for MVP
Live data is enough for current-state dashboards. Add storage only for historical trend requirements.

## ADR-004 Normalize API data
UI consumes stable application models, not Bitbucket response objects.

## ADR-005 Least privilege
Only request scopes required by implemented endpoints.

## ADR-006 Jira traceability
Use Jira keys in branch/commit/PR naming conventions to connect Bitbucket activity to Jira work.

## ADR-007 Historical metrics
If required, add scheduled sync + aggregated metrics rather than repeatedly scanning all Bitbucket history.
