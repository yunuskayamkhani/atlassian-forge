import { useEffect, useState } from 'react';

type ProjectContextState = {
  loadState: 'loading' | 'ready' | 'error';
  projectKey: string | null;
  errorMessage: string | null;
  reload: () => void;
};

export function useProjectContext(): ProjectContextState {
  const [attempt, setAttempt] = useState(0);
  const [context, setContext] = useState<ProjectContextState>({
    loadState: 'loading',
    projectKey: null,
    errorMessage: null,
    reload: () => undefined
  });

  useEffect(() => {
    let active = true;

    setContext((current) => ({ ...current, loadState: 'loading', errorMessage: null }));
    void import('@forge/bridge')
      .then(({ view }) => view.getContext())
      .then((value) => {
        const projectKey = value.extension.project?.key;
        if (typeof projectKey !== 'string' || !projectKey) {
          throw new Error('Could not determine the Jira project for this page.');
        }
        if (active) {
          setContext((current) => ({ ...current, loadState: 'ready', projectKey, errorMessage: null }));
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setContext({
            loadState: 'error',
            projectKey: null,
            errorMessage: error instanceof Error ? error.message : 'Could not load Jira project context.',
            reload: () => undefined
          });
        }
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  return { ...context, reload: () => setAttempt((value) => value + 1) };
}
