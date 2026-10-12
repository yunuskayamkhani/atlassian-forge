import { useEffect, useState } from 'react';
import { fetchIssueStatuses } from '../api/jira';
import type { JiraStatus } from '../types/models';

export function useJiraStatuses(keys: string[]): Record<string, JiraStatus> {
  const [statuses, setStatuses] = useState<Record<string, JiraStatus>>({});
  const keyList = Array.from(new Set(keys)).sort();
  const keyString = keyList.join(',');

  useEffect(() => {
    if (!keyString) {
      setStatuses({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await fetchIssueStatuses(keyString.split(','));
      if (cancelled) {
        return;
      }
      setStatuses(result.ok ? result.data : {});
    })();

    return () => {
      cancelled = true;
    };
  }, [keyString]);

  return statuses;
}
