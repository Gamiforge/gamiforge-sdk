import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { GamiforgeProvider } from '../../src/react/GamiforgeProvider';
import { useUserState } from '../../src/react/hooks/useUserState';
import { useXPProgress } from '../../src/react/hooks/useXPProgress';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const testConfig = {
  runtimeBaseUrl: 'https://runtime.test.com',
  apiKey: 'gf_test1234567890test1234567890te',
  retry: { maxRetries: 0 },
};

function mockUserStateResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        user_id: 'user_123',
        xp: 250,
        level: 2,
        streaks: { daily_activity: { currentCount: 3, longestCount: 7 } },
        achievements: ['getting_started'],
        ...overrides,
      },
    }),
  };
}

function mockAppearanceResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        toastPosition: 'top-right',
        theme: { preset: 'default' },
        achievementImages: {},
      },
    }),
  };
}

function mockProviderFetches(userStateOverrides: Record<string, unknown> = {}) {
  mockFetch
    .mockResolvedValueOnce(mockUserStateResponse(userStateOverrides))
    .mockResolvedValueOnce(mockAppearanceResponse());
}

// Test component that reads from context
function TestConsumer() {
  const { xp, level, achievements, loading } = useUserState();
  const { progress, xpToNextLevel } = useXPProgress();

  if (loading) return <div data-testid="loading">Loading...</div>;

  return (
    <div>
      <span data-testid="xp">{xp}</span>
      <span data-testid="level">{level}</span>
      <span data-testid="achievements">{achievements.join(',')}</span>
      <span data-testid="progress">{progress.toFixed(2)}</span>
      <span data-testid="xp-to-next">{xpToNextLevel}</span>
    </div>
  );
}

describe('GamiforgeProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches user state on mount and provides it to children', async () => {
    mockProviderFetches();

    render(
      <GamiforgeProvider config={testConfig} userId="user_123">
        <TestConsumer />
      </GamiforgeProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // After fetch completes
    await waitFor(() => {
      expect(screen.getByTestId('xp')).toHaveTextContent('250');
    });

    expect(screen.getByTestId('level')).toHaveTextContent('2');
    expect(screen.getByTestId('achievements')).toHaveTextContent('getting_started');
  });

  it('calculates XP progress correctly with default thresholds', async () => {
    // Level 2 requires 100 XP, Level 3 requires 300 XP
    // At 250 XP: progress = (250 - 100) / (300 - 100) = 150/200 = 0.75
    mockProviderFetches({ xp: 250, level: 2 });

    render(
      <GamiforgeProvider config={testConfig} userId="user_123">
        <TestConsumer />
      </GamiforgeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('progress')).toHaveTextContent('0.75');
    });

    expect(screen.getByTestId('xp-to-next')).toHaveTextContent('50');
  });

  it('throws when hooks are used outside provider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useUserState must be used inside a <GamiforgeProvider>'
    );

    spy.mockRestore();
  });

  it('applies theme CSS variables', async () => {
    mockProviderFetches();

    const { container } = render(
      <GamiforgeProvider
        config={testConfig}
        userId="user_123"
        theme={{ colors: { primary: '#FF0000' }, borderRadius: '16px' }}
      >
        <TestConsumer />
      </GamiforgeProvider>
    );

    const themeDiv = container.querySelector('[data-gamiforge-theme]');
    expect(themeDiv).toBeInTheDocument();
    expect(themeDiv?.getAttribute('style')).toContain('--gf-color-primary: #FF0000');
    expect(themeDiv?.getAttribute('style')).toContain('--gf-border-radius: 16px');
  });
});
