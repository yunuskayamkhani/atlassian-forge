import { describe, expect, it } from 'vitest';
import {
  mappingAllowsRepo,
  mappingForRepo,
  parseMappingList,
  parseSaveMapping,
  visibleMappings
} from './mappingsParse';
import { BitbucketApiError } from '../bitbucket/errors';

const mapping = {
  id: '10000',
  enabled: true,
  projectId: '10000',
  projectKey: 'SCRUM',
  projectName: 'Scrum',
  workspaceId: '{ws}',
  workspaceName: 'Acme',
  repositories: [{ id: '{repo}', name: 'payments', fullName: 'acme/payments' }],
  sprintMode: 'none' as const,
  boardId: '',
  boardName: '',
  sprintId: '',
  sprintName: '',
  viewers: []
};

describe('parseMappingList', () => {
  it('keeps valid mappings and defaults missing sprint fields', () => {
    const { sprintMode, boardId, boardName, sprintId, sprintName, ...withoutSprint } = mapping;
    expect(sprintMode).toBe('none');
    expect(boardId).toBe('');
    expect(boardName).toBe('');
    expect(sprintId).toBe('');
    expect(sprintName).toBe('');
    expect(parseMappingList([withoutSprint, { projectId: 'x' }])).toEqual([mapping]);
  });
});

describe('parseSaveMapping', () => {
  it('rejects a payload without repositories', () => {
    expect(() => parseSaveMapping({ ...mapping, repositories: [] })).toThrow(BitbucketApiError);
  });

  it('rejects an active sprint without a board', () => {
    expect(() => parseSaveMapping({ ...mapping, sprintMode: 'active' })).toThrow(
      /Select a Jira board to use the active sprint/
    );
  });

  it('rejects a selected sprint without a sprint id', () => {
    expect(() => parseSaveMapping({ ...mapping, sprintMode: 'selected', boardId: '1' })).toThrow(
      /Select the sprint the client should see/
    );
  });

  it('saves a selected client sprint', () => {
    expect(
      parseSaveMapping({
        ...mapping,
        sprintMode: 'selected',
        boardId: '12',
        boardName: 'SCRUM board',
        sprintId: '34',
        sprintName: 'Sprint 12'
      })
    ).toMatchObject({ sprintMode: 'selected', sprintId: '34', sprintName: 'Sprint 12' });
  });
});

describe('visibleMappings', () => {
  it('hides disabled mappings from viewers', () => {
    const disabled = { ...mapping, enabled: false };
    expect(visibleMappings([disabled], new Set(['10000']), false)).toEqual([]);
    expect(visibleMappings([disabled], new Set(['10000']), true)).toEqual([disabled]);
  });

  it('hides mappings for projects the user cannot browse', () => {
    expect(visibleMappings([mapping], new Set(['OTHER']), false)).toEqual([]);
    expect(visibleMappings([mapping], new Set(['SCRUM']), false)).toEqual([mapping]);
  });

  it('hides mappings from viewers who are not on the allowlist', () => {
    const restricted = { ...mapping, viewers: [{ accountId: 'ada', displayName: 'Ada' }] };
    expect(visibleMappings([restricted], new Set(['10000']), false, 'other')).toEqual([]);
    expect(visibleMappings([restricted], new Set(['10000']), false, 'ada')).toEqual([restricted]);
    expect(visibleMappings([restricted], new Set(['10000']), true, 'other')).toEqual([restricted]);
  });
});

describe('mappingAllowsRepo', () => {
  it('allows an enabled mapped repo the user can browse', () => {
    expect(mappingAllowsRepo([mapping], '{ws}', '{repo}', new Set(['10000']), false)).toBe(true);
  });

  it('denies an unmapped repo', () => {
    expect(mappingAllowsRepo([mapping], '{ws}', '{other}', new Set(['10000']), false)).toBe(false);
  });
});

describe('mappingForRepo', () => {
  it('returns the mapping that grants the repository', () => {
    expect(mappingForRepo([mapping], '{ws}', '{repo}', new Set(['10000']), false)).toEqual(mapping);
  });

  it('returns null when the repository is not mapped', () => {
    expect(mappingForRepo([mapping], '{ws}', '{other}', new Set(['10000']), false)).toBeNull();
  });
});
