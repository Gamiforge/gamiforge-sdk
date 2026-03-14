import { describe, it, expect } from 'vitest';
import {
  GamiforgeError,
  ApiError,
  NetworkError,
  TimeoutError,
  ConfigError,
} from '../../src/client/errors';

describe('SDK Error Classes', () => {
  it('GamiforgeError has code and message', () => {
    const err = new GamiforgeError('TEST_CODE', 'test message');
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('test message');
    expect(err.name).toBe('GamiforgeError');
    expect(err instanceof Error).toBe(true);
  });

  it('ApiError has statusCode and responseBody', () => {
    const body = { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } };
    const err = new ApiError(404, 'NOT_FOUND', 'User not found', body);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.responseBody).toEqual(body);
    expect(err.name).toBe('ApiError');
    expect(err instanceof GamiforgeError).toBe(true);
  });

  it('NetworkError has cause', () => {
    const cause = new TypeError('fetch failed');
    const err = new NetworkError('Network request failed', cause);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.cause).toBe(cause);
    expect(err.name).toBe('NetworkError');
  });

  it('TimeoutError has timeoutMs', () => {
    const err = new TimeoutError(10_000);
    expect(err.code).toBe('TIMEOUT');
    expect(err.timeoutMs).toBe(10_000);
    expect(err.message).toContain('10000');
    expect(err.name).toBe('TimeoutError');
  });

  it('ConfigError has CONFIG_ERROR code', () => {
    const err = new ConfigError('apiKey is required');
    expect(err.code).toBe('CONFIG_ERROR');
    expect(err.name).toBe('ConfigError');
  });
});
