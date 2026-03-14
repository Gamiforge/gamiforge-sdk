import type { ResolvedConfig } from './config.js';
import type { RawApiError } from './types.js';
import { ApiError, NetworkError, TimeoutError } from './errors.js';

// ---------------------------------------------------------------------------
// SDK version injected as header for runtime observability
// ---------------------------------------------------------------------------

const SDK_VERSION = '0.1.0';

// ---------------------------------------------------------------------------
// HTTP Transport
// ---------------------------------------------------------------------------

export interface RequestOptions {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export class HttpTransport {
  private readonly config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.config = config;
  }

  /**
   * Execute an HTTP request with retry and timeout.
   * Returns the parsed JSON response body.
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const headers: Record<string, string> = {
      'X-API-Key': this.config.apiKey,
      'X-SDK-Version': SDK_VERSION,
      'Content-Type': 'application/json',
    };

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: backoffMs * 2^(attempt-1)
        const delay = this.config.backoffMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }

      try {
        const response = await this.fetchWithTimeout(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: options.signal,
        });

        // Non-retryable errors (4xx except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          const errorBody = await this.safeParseJson(response);
          const apiErr = errorBody as RawApiError | undefined;
          throw new ApiError(
            response.status,
            apiErr?.error?.code ?? `HTTP_${response.status}`,
            apiErr?.error?.message ?? `Request failed with status ${response.status}`,
            errorBody
          );
        }

        // Retryable errors: 429 (except QUOTA_EXCEEDED), 5xx
        if (response.status === 429 || response.status >= 500) {
          const errorBody = await this.safeParseJson(response);
          const apiErr = errorBody as RawApiError | undefined;
          const errorCode = apiErr?.error?.code ?? `HTTP_${response.status}`;

          // QUOTA_EXCEEDED is a non-retryable 429 — the tenant's monthly
          // event limit has been reached. Retrying won't help.
          if (response.status === 429 && errorCode === 'QUOTA_EXCEEDED') {
            throw new ApiError(
              response.status,
              errorCode,
              apiErr?.error?.message ?? 'Monthly event quota exceeded',
              errorBody
            );
          }

          lastError = new ApiError(
            response.status,
            errorCode,
            apiErr?.error?.message ?? `Request failed with status ${response.status}`,
            errorBody
          );
          continue; // Retry
        }

        // Success
        return (await response.json()) as T;
      } catch (err) {
        if (err instanceof ApiError && err.statusCode < 500 && err.statusCode !== 429) {
          throw err; // Don't retry 4xx (except 429)
        }

        if (err instanceof TimeoutError || err instanceof NetworkError) {
          lastError = err;
          continue; // Retry
        }

        if (err instanceof TypeError || (err instanceof Error && err.name === 'TypeError')) {
          // fetch throws TypeError for network errors
          lastError = new NetworkError(
            `Network request failed: ${(err as Error).message}`,
            err as Error
          );
          continue; // Retry
        }

        // Abort signals should not retry
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new NetworkError('Request was aborted');
        }

        throw err;
      }
    }

    // All retries exhausted
    throw lastError ?? new NetworkError('Request failed after all retries');
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const base = `${this.config.runtimeBaseUrl}${path}`;
    if (!query) return base;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const existingSignal = init.signal;

    // Merge external abort signal with timeout
    if (existingSignal) {
      existingSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await globalThis.fetch(url, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Check if it was our timeout or external abort
        if (existingSignal?.aborted) {
          throw new NetworkError('Request was aborted');
        }
        throw new TimeoutError(this.config.timeout);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async safeParseJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
