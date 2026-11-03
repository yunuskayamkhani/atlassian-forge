import { describe, expect, it } from 'vitest';
import { extractJiraKeys, itemMatchesSprint } from './keys';

describe('extractJiraKeys', () => {
  it('finds unique Jira keys in a title', () => {
    expect(extractJiraKeys('PROJ-1 and PROJ-1 plus ABC-99')).toEqual(['PROJ-1', 'ABC-99']);
  });

  it('returns an empty array when there are no keys', () => {
    expect(extractJiraKeys('no keys here')).toEqual([]);
  });
});

describe('itemMatchesSprint', () => {
  it('matches when any key is in the sprint', () => {
    expect(itemMatchesSprint(['SCRUM-1', 'SCRUM-9'], new Set(['SCRUM-9', 'SCRUM-2']))).toBe(true);
  });

  it('rejects items with no sprint keys', () => {
    expect(itemMatchesSprint([], new Set(['SCRUM-1']))).toBe(false);
    expect(itemMatchesSprint(['OTHER-1'], new Set(['SCRUM-1']))).toBe(false);
  });
});
