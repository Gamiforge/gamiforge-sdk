import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { GamiforgeClient } from '../client/index.js';
import { GamiforgeContext, type GamiforgeContextValue } from './context.js';
import { DEFAULT_LEVEL_THRESHOLDS } from '../client/types.js';
import type { GamiforgeConfig, UserState, LevelThreshold, AppearanceConfig, ToastPosition } from '../client/types.js';
import type { GamiforgeTheme } from './theme/types.js';
import { themeToCSSProperties } from './theme/types.js';

// ---------------------------------------------------------------------------
// Theme Preset Color Mappings
// ---------------------------------------------------------------------------

const THEME_PRESET_COLORS: Record<string, Record<string, string>> = {
  ocean: {
    '--gf-color-primary': '#0077b6',
    '--gf-color-primary-light': '#90e0ef',
    '--gf-color-success': '#06d6a0',
    '--gf-color-warning': '#ffd166',
    '--gf-color-danger': '#ef476f',
  },
  sunset: {
    '--gf-color-primary': '#e76f51',
    '--gf-color-primary-light': '#f4a261',
    '--gf-color-success': '#2a9d8f',
    '--gf-color-warning': '#e9c46a',
    '--gf-color-danger': '#e63946',
  },
  dark: {
    '--gf-color-primary': '#bb86fc',
    '--gf-color-primary-light': '#cf6679',
    '--gf-color-success': '#03dac6',
    '--gf-color-warning': '#ffb74d',
    '--gf-color-danger': '#cf6679',
    '--gf-color-background': '#121212',
    '--gf-color-surface': '#1e1e1e',
    '--gf-color-text': '#e0e0e0',
    '--gf-color-text-secondary': '#a0a0a0',
    '--gf-color-border': '#333333',
  },
  minimal: {
    '--gf-color-primary': '#6b7280',
    '--gf-color-primary-light': '#9ca3af',
    '--gf-color-success': '#059669',
    '--gf-color-warning': '#d97706',
    '--gf-color-danger': '#dc2626',
  },
};

// ---------------------------------------------------------------------------
// Provider Props
// ---------------------------------------------------------------------------

export interface GamiforgeProviderProps {
  /** Runtime connection configuration */
  config: GamiforgeConfig;

  /** External user ID (your application's user identifier) */
  userId: string;

  /** Optional level thresholds — defaults to the Gamiforge starter config */
  levelThresholds?: LevelThreshold[];

  /** Optional theme overrides (these take precedence over tenant appearance config) */
  theme?: GamiforgeTheme;

  /** Children */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

export function GamiforgeProvider({
  config,
  userId,
  levelThresholds = DEFAULT_LEVEL_THRESHOLDS,
  theme,
  children,
}: GamiforgeProviderProps) {
  // Create client once (memoized by config identity)
  const client = useMemo(() => new GamiforgeClient(config), [
    config.runtimeBaseUrl,
    config.apiKey,
    config.environment,
    config.timeout,
    config.retry?.maxRetries,
    config.retry?.backoffMs,
  ]);

  const [state, setStateRaw] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [appearance, setAppearance] = useState<AppearanceConfig | null>(null);

  // Track mounted state to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch user state
  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const userState = await client.getUserState(userId);
      if (mountedRef.current) {
        setStateRaw(userState);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [client, userId]);

  // Set state directly (used after trackEvent to optimistically update)
  const setState = useCallback((newState: UserState) => {
    if (mountedRef.current) {
      setStateRaw(newState);
    }
  }, []);

  // Initial fetch on mount + when userId changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Fetch appearance config on mount (fire-and-forget — non-blocking)
  useEffect(() => {
    let cancelled = false;
    client.getAppearance()
      .then((cfg) => {
        if (!cancelled && mountedRef.current) {
          setAppearance(cfg);
        }
      })
      .catch((err) => {
        // Appearance fetch is best-effort; fall back to defaults
        console.warn('[Gamiforge] Failed to fetch appearance config:', err);
      });
    return () => { cancelled = true; };
  }, [client]);

  // Clean up client on unmount
  useEffect(() => {
    return () => {
      client.destroy();
    };
  }, [client]);

  // Resolve toast position and achievement images from appearance config
  const toastPosition: ToastPosition = appearance?.toastPosition ?? 'top-right';
  const achievementImages: Record<string, string> = appearance?.achievementImages ?? {};

  // Build context value
  const contextValue = useMemo<GamiforgeContextValue>(
    () => ({
      client,
      userId,
      state,
      loading,
      error,
      levelThresholds,
      refetch,
      setState,
      appearance,
      toastPosition,
      achievementImages,
    }),
    [client, userId, state, loading, error, levelThresholds, refetch, setState, appearance, toastPosition, achievementImages]
  );

  // Build theme CSS variables — merge appearance preset → custom colors → explicit theme prop
  const themeStyle = useMemo(() => {
    const vars: Record<string, string> = {};

    // Layer 1: Appearance preset colors (from admin dashboard)
    if (appearance?.theme) {
      const preset = appearance.theme.preset;
      if (preset && preset !== 'default' && preset !== 'custom' && THEME_PRESET_COLORS[preset]) {
        Object.assign(vars, THEME_PRESET_COLORS[preset]);
      }

      // Layer 2: Custom colors (when preset === 'custom')
      if (preset === 'custom' && appearance.theme.customColors) {
        const cc = appearance.theme.customColors;
        if (cc.primary) vars['--gf-color-primary'] = cc.primary;
        if (cc.primaryLight) vars['--gf-color-primary-light'] = cc.primaryLight;
        if (cc.success) vars['--gf-color-success'] = cc.success;
        if (cc.warning) vars['--gf-color-warning'] = cc.warning;
        if (cc.danger) vars['--gf-color-danger'] = cc.danger;
        if (cc.background) vars['--gf-color-background'] = cc.background;
        if (cc.surface) vars['--gf-color-surface'] = cc.surface;
        if (cc.text) vars['--gf-color-text'] = cc.text;
        if (cc.textSecondary) vars['--gf-color-text-secondary'] = cc.textSecondary;
        if (cc.border) vars['--gf-color-border'] = cc.border;
      }
    }

    // Layer 3: Explicit theme prop overrides (highest precedence)
    if (theme) {
      Object.assign(vars, themeToCSSProperties(theme));
    }

    return Object.keys(vars).length > 0 ? vars : undefined;
  }, [theme, appearance]);

  return (
    <GamiforgeContext.Provider value={contextValue}>
      <div data-gamiforge-theme="" style={themeStyle}>
        {children}
      </div>
    </GamiforgeContext.Provider>
  );
}
