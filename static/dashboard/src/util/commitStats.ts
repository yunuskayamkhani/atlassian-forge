import type { Commit } from '../types/models';
import type { DashboardFilters } from '../types/filters';

const DAY_MS = 24 * 60 * 60 * 1000;

export type DateWindow = { from: number | null; to: number | null };

export function dateWindow(filters: DashboardFilters, now: number = Date.now()): DateWindow {
  if (filters.dateRange === 'custom') {
    const from = filters.customFrom ? new Date(filters.customFrom).getTime() : null;
    const to = filters.customTo ? new Date(filters.customTo).getTime() + DAY_MS - 1 : null;
    return {
      from: Number.isNaN(from as number) ? null : from,
      to: Number.isNaN(to as number) ? null : to
    };
  }

  const days = filters.dateRange === '30d' ? 30 : filters.dateRange === '90d' ? 90 : 7;
  return { from: now - days * DAY_MS, to: null };
}

export function filterByWindow(commits: Commit[], window: DateWindow): Commit[] {
  return commits.filter((commit) => {
    const time = new Date(commit.date).getTime();
    if (Number.isNaN(time)) {
      return false;
    }
    if (window.from !== null && time < window.from) {
      return false;
    }
    if (window.to !== null && time > window.to) {
      return false;
    }
    return true;
  });
}

export type Bucket = { label: string; value: number };

export function commitsByDay(commits: Commit[], maxBuckets = 14): Bucket[] {
  const counts = new Map<string, number>();
  for (const commit of commits) {
    const date = new Date(commit.date);
    if (Number.isNaN(date.getTime())) {
      continue;
    }
    const key = date.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-maxBuckets)
    .map(([key, value]) => ({ label: key.slice(5), value }));
}

export function commitsByAuthor(commits: Commit[], maxAuthors = 8): Bucket[] {
  const counts = new Map<string, number>();
  for (const commit of commits) {
    counts.set(commit.author, (counts.get(commit.author) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxAuthors)
    .map(([label, value]) => ({ label, value }));
}
