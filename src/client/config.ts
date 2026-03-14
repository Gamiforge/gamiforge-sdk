import type { GamiforgeConfig } from './types.js';
import { ConfigError } from './errors.js';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_TIMEOUT = 10_000;
export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_BACKOFF_MS = 500;

// ---------------------------------------------------------------------------
// Resolved (with defaults applied)
// ---------------------------------------------------------------------------

export interface ResolvedConfig {
  runtimeBaseUrl: string;
  apiKey: string;
  environment: string;
  maxRetries: number;
  backoffMs: number;
  timeout: number;
}

// ---------------------------------------------------------------------------
// Validation + Resolution
// ---------------------------------------------------------------------------

export function resolveConfig(raw: GamiforgeConfig): ResolvedConfig {
  if (!raw.runtimeBaseUrl || typeof raw.runtimeBaseUrl !== 'string') {
    throw new ConfigError('runtimeBaseUrl is required and must be a non-empty string');
  }

  if (!raw.apiKey || typeof raw.apiKey !== 'string') {
    throw new ConfigError('apiKey is required and must be a non-empty string');
  }

  if (!raw.apiKey.startsWith('gf_')) {
    throw new ConfigError('apiKey must start with "gf_"');
  }

  // Strip trailing slash from base URL
  const runtimeBaseUrl = raw.runtimeBaseUrl.replace(/\/+$/, '');

  return {
    runtimeBaseUrl,
    apiKey: raw.apiKey,
    environment: raw.environment ?? 'production',
    maxRetries: raw.retry?.maxRetries ?? DEFAULT_MAX_RETRIES,
    backoffMs: raw.retry?.backoffMs ?? DEFAULT_BACKOFF_MS,
    timeout: raw.timeout ?? DEFAULT_TIMEOUT,
  };
}
