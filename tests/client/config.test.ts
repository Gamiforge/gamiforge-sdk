import { describe, it, expect } from 'vitest';
import { resolveConfig } from '../../src/client/config';
import { ConfigError } from '../../src/client/errors';

describe('resolveConfig', () => {
  const validConfig = {
    runtimeBaseUrl: 'https://runtime.example.com',
    apiKey: 'gf_abcdef1234567890abcdef1234567890',
  };

  it('resolves a valid config with defaults', () => {
    const resolved = resolveConfig(validConfig);
    expect(resolved.runtimeBaseUrl).toBe('https://runtime.example.com');
    expect(resolved.apiKey).toBe('gf_abcdef1234567890abcdef1234567890');
    expect(resolved.environment).toBe('production');
    expect(resolved.maxRetries).toBe(2);
    expect(resolved.backoffMs).toBe(500);
    expect(resolved.timeout).toBe(10_000);
  });

  it('strips trailing slashes from runtimeBaseUrl', () => {
    const resolved = resolveConfig({
      ...validConfig,
      runtimeBaseUrl: 'https://runtime.example.com///',
    });
    expect(resolved.runtimeBaseUrl).toBe('https://runtime.example.com');
  });

  it('applies custom retry and timeout settings', () => {
    const resolved = resolveConfig({
      ...validConfig,
      environment: 'staging',
      timeout: 5000,
      retry: { maxRetries: 5, backoffMs: 1000 },
    });
    expect(resolved.environment).toBe('staging');
    expect(resolved.timeout).toBe(5000);
    expect(resolved.maxRetries).toBe(5);
    expect(resolved.backoffMs).toBe(1000);
  });

  it('throws ConfigError when runtimeBaseUrl is missing', () => {
    expect(() =>
      resolveConfig({ runtimeBaseUrl: '', apiKey: validConfig.apiKey })
    ).toThrow(ConfigError);
  });

  it('throws ConfigError when apiKey is missing', () => {
    expect(() =>
      resolveConfig({ runtimeBaseUrl: validConfig.runtimeBaseUrl, apiKey: '' })
    ).toThrow(ConfigError);
  });

  it('throws ConfigError when apiKey does not start with gf_', () => {
    expect(() =>
      resolveConfig({
        runtimeBaseUrl: validConfig.runtimeBaseUrl,
        apiKey: 'sk_invalid_key',
      })
    ).toThrow(ConfigError);
    expect(() =>
      resolveConfig({
        runtimeBaseUrl: validConfig.runtimeBaseUrl,
        apiKey: 'sk_invalid_key',
      })
    ).toThrow('apiKey must start with "gf_"');
  });
});
