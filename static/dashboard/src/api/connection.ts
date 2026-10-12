import { invokeResult } from './invokeResult';
import type { Result } from '../types/models';

export type ConnectionStatus = {
  connected: boolean;
  isAdmin: boolean;
};

export function fetchConnectionStatus(): Promise<Result<ConnectionStatus>> {
  return invokeResult<ConnectionStatus>('getConnectionStatus');
}

export function saveBitbucketConnection(email: string, token: string): Promise<Result<{ connected: true }>> {
  return invokeResult<{ connected: true }>('connectBitbucket', { email, token });
}

export function removeBitbucketConnection(): Promise<Result<{ connected: false }>> {
  return invokeResult<{ connected: false }>('disconnectBitbucket');
}
