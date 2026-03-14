// ---------------------------------------------------------------------------
// SDK Error Hierarchy
// ---------------------------------------------------------------------------

/**
 * Base error class for all Gamiforge SDK errors.
 */
export class GamiforgeError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GamiforgeError';
    this.code = code;
    // Restore prototype chain (required for custom Error subclasses in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the runtime returns a non-2xx HTTP response.
 */
export class ApiError extends GamiforgeError {
  public readonly statusCode: number;
  public readonly responseBody: unknown;

  constructor(statusCode: number, code: string, message: string, responseBody?: unknown) {
    super(code, message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/**
 * Thrown when a network error occurs (DNS failure, connection refused, etc.).
 */
export class NetworkError extends GamiforgeError {
  public readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super('NETWORK_ERROR', message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Thrown when a request exceeds the configured timeout.
 */
export class TimeoutError extends GamiforgeError {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super('TIMEOUT', `Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Thrown when the SDK is constructed with an invalid configuration.
 */
export class ConfigError extends GamiforgeError {
  constructor(message: string) {
    super('CONFIG_ERROR', message);
    this.name = 'ConfigError';
  }
}
