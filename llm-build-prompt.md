# LLM Build Instructions

You are implementing a Jira Cloud Forge app called `Bitbucket Engineering Dashboard`.

## Goal
Create a production-quality Jira Cloud app using Forge + Custom UI + React that reads Bitbucket Cloud engineering data and displays interactive analytics.

## Constraints
- Use current Atlassian Forge APIs/docs.
- Use `requestBitbucket` for supported Bitbucket REST calls.
- Do not invent API endpoints or Forge scopes.
- Verify every endpoint against current docs.
- Do not expose credentials/tokens.
- Use least privilege.
- Do not add external infrastructure unless required.
- Do not add a database for MVP.
- Keep token usage low: inspect existing files before changing them; avoid repeating unchanged code.

## Build order
1. Bootstrap Forge app.
2. Add Jira page/global module with Custom UI.
3. Implement workspace/repository discovery.
4. Implement repositories.
5. Implement PRs.
6. Implement commits.
7. Implement pipelines.
8. Implement deployments.
9. Implement KPI aggregation.
10. Add filters/charts/tables.
11. Add tests.
12. Run lint/build/deploy checks.

## Required UI
- KPI cards
- date/repository filters
- PR table
- commit trend
- pipeline health
- deployments
- developer activity
- refresh + last updated
- Bitbucket/Jira links

## Output discipline
When coding:
- first inspect repository structure
- make the smallest coherent change
- show changed files only
- do not paste entire unchanged files
- after each phase, report: changed files, command to test, result, next phase
