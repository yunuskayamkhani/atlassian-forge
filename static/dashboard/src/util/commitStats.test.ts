import { describe, expect, it } from 'vitest';
import { commitsByAuthor, commitsByDay, dateWindow, filterByWindow } from './commitStats';
import { DEFAULT_FILTERS } from '../types/filters';
import type { Commit } from '../types/models';

function commit(date: string, author: string): Commit {
  return { hash: date + author, shortHash: 'abc1234', message: 'x', author, date, webUrl: '' };
}

const commits: Commit[] = [
  commit('2026-09-10T10:00:00Z', 'Ada'),
  commit('2026-09-10T12:00:00Z', 'Ada'),
  commit('2026-09-09T09:00:00Z', 'Grace'),
  commit('2026-06-01T09:00:00Z', 'Old')
];

describe('dateWindow', () => {
  it('computes a rolling window for presets', () => {
    const now = new Date('2026-09-11T00:00:00Z').getTime();
    const window = dateWindow({ ...DEFAULT_FILTERS, dateRange: '7d' }, now);
    expect(window.to).toBeNull();
    expect(window.from).toBe(now - 7 * 24 * 60 * 60 * 1000);
  });

  it('uses custom dates when provided', () => {
    const window = dateWindow({
      ...DEFAULT_FILTERS,
      dateRange: 'custom',
      customFrom: '2026-09-01',
      customTo: '2026-09-10'
    });
    expect(window.from).toBe(new Date('2026-09-01').getTime());
    expect(window.to).toBeGreaterThan(new Date('2026-09-10').getTime());
  });
});

describe('filterByWindow', () => {
  it('keeps only commits inside the window', () => {
    const now = new Date('2026-09-11T00:00:00Z').getTime();
    const result = filterByWindow(commits, dateWindow({ ...DEFAULT_FILTERS, dateRange: '7d' }, now));
    expect(result).toHaveLength(3);
    expect(result.some((c) => c.author === 'Old')).toBe(false);
  });
});

describe('commitsByDay', () => {
  it('counts commits per day in ascending order', () => {
    const buckets = commitsByDay(commits);
    expect(buckets[buckets.length - 1]).toEqual({ label: '09-10', value: 2 });
  });
});

describe('commitsByAuthor', () => {
  it('counts commits per author, busiest first', () => {
    const buckets = commitsByAuthor(commits);
    expect(buckets[0]).toEqual({ label: 'Ada', value: 2 });
  });
});
