export class BitbucketApiError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'BitbucketApiError';
    this.status = status;
    this.retryable = retryable;
  }
}

export function errorFromStatus(status: number): BitbucketApiError {
  if (status === 401) {
    return new BitbucketApiError('Bitbucket access was denied. Grant access and retry.', 401, false);
  }
  if (status === 403) {
    return new BitbucketApiError('You do not have permission to view this Bitbucket data.', 403, false);
  }
  if (status === 404) {
    return new BitbucketApiError('The Bitbucket workspace or repository was not found.', 404, false);
  }
  if (status === 429) {
    return new BitbucketApiError('Bitbucket rate limit reached. Retry in a moment.', 429, true);
  }

  return new BitbucketApiError(`Bitbucket API error (${status}).`, status, status >= 500);
}

export type FailureResult = {
  ok: false;
  status: number;
  message: string;
  retryable: boolean;
};

export type SuccessResult<T> = {
  ok: true;
  data: T;
};

export type Result<T> = SuccessResult<T> | FailureResult;

export function toFailureResult(error: unknown): FailureResult {
  if (error instanceof BitbucketApiError) {
    return {
      ok: false,
      status: error.status,
      message: error.message,
      retryable: error.retryable
    };
  }

  return {
    ok: false,
    status: 500,
    message: 'Bitbucket request failed.',
    retryable: false
  };
}
