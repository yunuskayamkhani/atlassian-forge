import type { Result } from '../types/models';

export function unwrapInvoke<T>(value: unknown): T {
  if (value && typeof value === 'object' && 'body' in value) {
    return (value as { body: T }).body;
  }

  return value as T;
}

function toInvokeFailure(error: unknown): Result<never> {
  const message = error instanceof Error ? error.message : 'Unable to reach the Forge backend.';
  const missingBridge = /Custom UI bridge/i.test(message);

  return {
    ok: false,
    status: missingBridge ? 503 : 500,
    message: missingBridge
      ? 'Open Apps → Bitbucket Engineering in Jira using Chrome or Firefox. A blank Jira page means DNS is blocking *.cdn.prod.atlassian-dev.net — set DNS to 8.8.8.8 and 1.1.1.1, then flush with ipconfig /flushdns.'
      : message,
    retryable: !missingBridge
  };
}

const INVOKE_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, key: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`The Forge backend did not respond in time (${key}). Retry.`));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function invokeResult<T>(
  functionKey: string,
  payload?: Record<string, unknown>
): Promise<Result<T>> {
  try {
    const { invoke } = await import('@forge/bridge');
    const response = unwrapInvoke<Result<T>>(
      await withTimeout(invoke(functionKey, payload), INVOKE_TIMEOUT_MS, functionKey)
    );

    if (response && typeof response === 'object' && 'ok' in response) {
      return response;
    }

    throw new Error('Unexpected backend response');
  } catch (error) {
    return toInvokeFailure(error);
  }
}
