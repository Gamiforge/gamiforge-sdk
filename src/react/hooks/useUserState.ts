import { useContext } from 'react';
import { GamiforgeContext } from '../context.js';
import type { UserState } from '../../client/types.js';

export interface UseUserStateReturn {
  /** Current user gamification state (null while loading) */
  state: UserState | null;
  /** XP total (0 while loading) */
  xp: number;
  /** Current level (0 while loading) */
  level: number;
  /** All streaks */
  streaks: UserState['streaks'];
  /** All unlocked achievement keys */
  achievements: string[];
  /** Whether the initial state fetch is in progress */
  loading: boolean;
  /** Error from the last fetch, if any */
  error: Error | null;
  /** Re-fetch user state from the runtime */
  refetch: () => Promise<void>;
}

/**
 * Access the current user's gamification state.
 *
 * State is fetched automatically by `<GamiforgeProvider>` on mount
 * and updated after each `trackEvent()` call.
 *
 * Must be used inside a `<GamiforgeProvider>`.
 */
export function useUserState(): UseUserStateReturn {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'useUserState must be used inside a <GamiforgeProvider>. ' +
        'Wrap your component tree with <GamiforgeProvider config={...} userId="...">.'
    );
  }

  return {
    state: ctx.state,
    xp: ctx.state?.xp ?? 0,
    level: ctx.state?.level ?? 0,
    streaks: ctx.state?.streaks ?? {},
    achievements: ctx.state?.achievements ?? [],
    loading: ctx.loading,
    error: ctx.error,
    refetch: ctx.refetch,
  };
}
