/**
 * Retry utility with exponential backoff.
 * Wraps an async function to retry on failure.
 */
export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  baseDelayMs: 1000,
  retryableStatuses: [500, 502, 503, 504],
};

/**
 * Execute an async function with retry logic.
 * Only retries on retryable errors (server errors, network failures).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      const status = (error as any)?.status;
      const isRetryable =
        !status || opts.retryableStatuses.includes(status);

      if (!isRetryable || attempt >= opts.maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = opts.baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
