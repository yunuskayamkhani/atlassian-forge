import { BitbucketApiError } from './errors';
import { isAllowedBitbucketUrl } from './identifiers';

export type Page<T> = {
  values: T[];
  next?: string;
};

export const DEFAULT_MAX_PAGES = 4;
export const DEFAULT_MAX_ITEMS = 200;

export function parsePage<T>(payload: unknown, mapItem: (raw: unknown) => T | null): Page<T> {
  if (!payload || typeof payload !== 'object') {
    throw new BitbucketApiError('Bitbucket returned a malformed response.', 502, false);
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.values)) {
    throw new BitbucketApiError('Bitbucket returned a malformed response.', 502, false);
  }

  const next = typeof record.next === 'string' && isAllowedBitbucketUrl(record.next) ? record.next : undefined;

  return {
    values: record.values.map(mapItem).filter((item): item is T => item !== null),
    next
  };
}

export async function collectPages<T>(options: {
  fetchFirst: () => Promise<Page<T>>;
  fetchNext: (nextUrl: string) => Promise<Page<T>>;
  maxPages?: number;
  maxItems?: number;
}): Promise<T[]> {
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
  const items: T[] = [];
  let page = await options.fetchFirst();
  let pages = 1;

  while (true) {
    items.push(...page.values);

    if (items.length >= maxItems) {
      return items.slice(0, maxItems);
    }

    if (!page.next || pages >= maxPages) {
      return items;
    }

    page = await options.fetchNext(page.next);
    pages += 1;
  }
}
