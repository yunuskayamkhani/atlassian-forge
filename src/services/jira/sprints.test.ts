import { describe, expect, it } from 'vitest';
import { BitbucketApiError } from '../bitbucket/errors';
import {
  parseBoards,
  parseSprintIssueKeys,
  parseSprints,
  resolveClientSprint,
  type AgileGet
} from './sprints';
import type { JiraResponse } from './client';

function jsonRes(body: unknown, status = 200): JiraResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}

describe('parseBoards', () => {
  it('maps board id, name, and type', () => {
    const page = parseBoards({
      isLast: true,
      values: [{ id: 1, name: 'SCRUM board', type: 'scrum' }, { id: 2, name: '' }]
    });
    expect(page.items).toEqual([{ id: '1', name: 'SCRUM board', type: 'scrum' }]);
    expect(page.isLast).toBe(true);
  });
});

describe('parseSprints', () => {
  it('maps sprint id, name, and lowercase state', () => {
    const page = parseSprints({
      startAt: 0,
      total: 1,
      values: [{ id: 34, name: 'Sprint 12', state: 'active' }]
    });
    expect(page.items).toEqual([{ id: '34', name: 'Sprint 12', state: 'active' }]);
    expect(page.isLast).toBe(true);
  });
});

describe('parseSprintIssueKeys', () => {
  it('collects issue keys and the next start offset', () => {
    const page = parseSprintIssueKeys({
      startAt: 0,
      total: 2,
      issues: [{ key: 'SCRUM-1' }, { key: 'SCRUM-2' }]
    });
    expect(page.keys).toEqual(['SCRUM-1', 'SCRUM-2']);
    expect(page.isLast).toBe(true);
    expect(page.nextStart).toBe(2);
  });
});

describe('resolveClientSprint', () => {
  const mapping = {
    sprintMode: 'none',
    boardId: '1',
    sprintId: '',
    sprintName: ''
  };

  it('does not filter when sprint mode is none', async () => {
    expect(await resolveClientSprint(mapping)).toBeNull();
  });

  it('uses the only active sprint', async () => {
    const get: AgileGet = async (kind) => {
      if (kind === 'sprints') {
        return jsonRes({
          isLast: true,
          values: [
            { id: 10, name: 'Sprint 10', state: 'active' },
            { id: 11, name: 'Sprint 11', state: 'future' }
          ]
        });
      }
      return jsonRes({ startAt: 0, total: 1, issues: [{ key: 'SCRUM-1' }] });
    };

    const sprint = await resolveClientSprint({ ...mapping, sprintMode: 'active' }, get);
    expect(sprint?.sprintId).toBe('10');
    expect(sprint?.sprintName).toBe('Sprint 10');
    expect(Array.from(sprint?.keys ?? [])).toEqual(['SCRUM-1']);
  });

  it('returns empty keys when there is no active sprint', async () => {
    const get: AgileGet = async () => jsonRes({ isLast: true, values: [] });
    const sprint = await resolveClientSprint({ ...mapping, sprintMode: 'active' }, get);
    expect(sprint).toEqual({ sprintId: '', sprintName: 'No active sprint', keys: new Set() });
  });

  it('asks the admin to pick when two sprints are active and none is saved', async () => {
    const get: AgileGet = async () =>
      jsonRes({
        isLast: true,
        values: [
          { id: 10, name: 'Sprint 10', state: 'active' },
          { id: 11, name: 'Sprint 11', state: 'active' }
        ]
      });

    await expect(resolveClientSprint({ ...mapping, sprintMode: 'active' }, get)).rejects.toThrow(
      BitbucketApiError
    );
  });

  it('keeps the saved sprint when it is still one of the active sprints', async () => {
    const get: AgileGet = async (kind) => {
      if (kind === 'sprints') {
        return jsonRes({
          isLast: true,
          values: [
            { id: 10, name: 'Sprint 10', state: 'active' },
            { id: 11, name: 'Sprint 11', state: 'active' }
          ]
        });
      }
      return jsonRes({ startAt: 0, total: 1, issues: [{ key: 'SCRUM-11' }] });
    };

    const sprint = await resolveClientSprint(
      { sprintMode: 'active', boardId: '1', sprintId: '11', sprintName: 'Sprint 11' },
      get
    );
    expect(sprint?.sprintId).toBe('11');
    expect(Array.from(sprint?.keys ?? [])).toEqual(['SCRUM-11']);
  });

  it('loads issue keys for a specifically selected sprint', async () => {
    const get: AgileGet = async (kind) => {
      if (kind === 'issues') {
        return jsonRes({ startAt: 0, total: 1, issues: [{ key: 'SCRUM-4' }] });
      }
      return jsonRes({ isLast: true, values: [] });
    };

    const sprint = await resolveClientSprint(
      { sprintMode: 'selected', boardId: '1', sprintId: '4', sprintName: 'Sprint 4' },
      get
    );
    expect(sprint?.sprintName).toBe('Sprint 4');
    expect(Array.from(sprint?.keys ?? [])).toEqual(['SCRUM-4']);
  });
});
