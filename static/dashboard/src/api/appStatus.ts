import { invoke } from '@forge/bridge';
import type { AppStatus } from '../types/status';

function isAppStatus(value: unknown): value is AppStatus {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'ok' in value &&
      (value as AppStatus).ok === true &&
      typeof (value as AppStatus).name === 'string' &&
      typeof (value as AppStatus).generatedAt === 'string'
  );
}

export async function fetchAppStatus(): Promise<AppStatus> {
  const response: unknown = await invoke('getAppStatus');

  if (isAppStatus(response)) {
    return response;
  }

  if (response && typeof response === 'object' && 'body' in response && isAppStatus(response.body)) {
    return response.body;
  }

  throw new Error('Unexpected backend response');
}
