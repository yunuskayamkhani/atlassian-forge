import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from './filters';

describe('DEFAULT_FILTERS', () => {
  it('starts with all repositories and a 7 day range', () => {
    expect(DEFAULT_FILTERS.projectId).toBeNull();
    expect(DEFAULT_FILTERS.workspaceId).toBeNull();
    expect(DEFAULT_FILTERS.repositoryId).toBe('ALL');
    expect(DEFAULT_FILTERS.dateRange).toBe('7d');
    expect(DEFAULT_FILTERS.prStatus).toBe('ALL');
    expect(DEFAULT_FILTERS.developer).toBe('ALL');
    expect(DEFAULT_FILTERS.environment).toBe('ALL');
  });
});
