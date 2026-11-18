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
  projectKey: 'PICO',
  projectName: 'Scrum',
  workspaceId: '{ws}',
  workspaceName: 'Acme',
  repositories: [{ id: '{repo}', name: 'awc_bookingflow_web', fullName: 'owaismasoodq3/awc_bookingflow_web' }],
  sprintMode: 'none' as const,
  boardId: '',
  boardName: '',
  sprintId: '',
  sprintName: '',
  targetBranch: '',
  viewers: [{ accountId: 'ada', displayName: 'Ada' }]
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
  it('rejects a mapping with no explicitly allowed viewers', () => {
    expect(() => parseSaveMapping({ ...mapping, viewers: [] })).toThrow(
      /Add at least one viewer to grant Bitbucket data access/
    );
  });

  it('rejects a payload without repositories', () => {
    expect(() => parseSaveMapping({ ...mapping, repositories: [] })).toThrow(BitbucketApiError);
  });

  it('saves the Bitbucket destination branch and clears legacy Jira sprint filters', () => {
    expect(
      parseSaveMapping({
        ...mapping,
        sprintMode: 'selected',
        boardId: '12',
        boardName: 'SCRUM board',
        sprintId: '34',
        sprintName: 'Sprint 12',
        targetBranch: 'Sprint-67/Development_Sprint-67'
      })
    ).toMatchObject({
      sprintMode: 'none',
      boardId: '',
      sprintId: '',
      targetBranch: 'Sprint-67/Development_Sprint-67'
    });
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
    expect(visibleMappings([mapping], new Set(['PICO']), false, 'ada')).toEqual([mapping]);
  });

  it('excludes mappings outside the configured project and repository allowlist', () => {
    expect(
      visibleMappings([{ ...mapping, projectKey: 'OTHER' }], new Set(['10000']), true)
    ).toEqual([]);
    expect(
      visibleMappings(
        [{ ...mapping, repositories: [{ ...mapping.repositories[0], fullName: 'owaismasoodq3/other' }] }],
        new Set(['10000']),
        true
      )
    ).toEqual([]);
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
    expect(mappingAllowsRepo([mapping], '{ws}', '{repo}', new Set(['10000']), false, 'ada')).toBe(true);
  });

  it('denies access when the viewer list is empty', () => {
    const noViewers = { ...mapping, viewers: [] };
    expect(mappingAllowsRepo([noViewers], '{ws}', '{repo}', new Set(['10000']), false, 'ada')).toBe(false);
  });

  it('denies an unmapped repo', () => {
    expect(mappingAllowsRepo([mapping], '{ws}', '{other}', new Set(['10000']), false)).toBe(false);
  });
});

describe('mappingForRepo', () => {
  it('returns the mapping that grants the repository', () => {
    expect(mappingForRepo([mapping], '{ws}', '{repo}', new Set(['10000']), false, 'ada')).toEqual(mapping);
  });

  it('does not grant dashboard admins access unless they are listed viewers', () => {
    expect(mappingForRepo([mapping], '{ws}', '{repo}', new Set(['10000']), true, 'admin')).toBeNull();
  });

  it('returns null when the repository is not mapped', () => {
    expect(mappingForRepo([mapping], '{ws}', '{other}', new Set(['10000']), false, 'ada')).toBeNull();
  });
});
