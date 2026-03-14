import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { GamiforgeContext } from '../context.js';
import type { LeaderboardEntry } from '../../client/types.js';

export interface UseLeaderboardOptions {
  type: 'xp' | 'streak';
  /** Required when type is "streak" */
  streakKey?: string;
  /** Number of entries to fetch (1–100, default 10) */
  limit?: number;
  /** Time window in days for XP leaderboards */
  windowDays?: number;
  /** Auto-refresh interval in ms (0 = disabled, default 0) */
  pollInterval?: number;
}

export interface UseLeaderboardReturn {
  /** Leaderboard entries */
  entries: LeaderboardEntry[];
  /** Whether the initial fetch is in progress */
  loading: boolean;
  /** Error from the last fetch */
  error: Error | null;
  /** Manually re-fetch the leaderboard */
  refetch: () => Promise<void>;
}

/**
 * Fetch leaderboard data from the Gamiforge Runtime.
 *
 * Supports optional polling for live updates.
 *
 * Must be used inside a `<GamiforgeProvider>`.
 */
export function useLeaderboard(options: UseLeaderboardOptions): UseLeaderboardReturn {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'useLeaderboard must be used inside a <GamiforgeProvider>.'
    );
  }

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ctx.client.getLeaderboard({
        type: options.type,
        streakKey: options.streakKey,
        limit: options.limit,
        windowDays: options.windowDays,
      });
      if (mountedRef.current) {
        setEntries(result.entries);
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
  }, [ctx.client, options.type, options.streakKey, options.limit, options.windowDays]);

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Polling
  useEffect(() => {
    if (!options.pollInterval || options.pollInterval <= 0) return;

    const intervalId = setInterval(refetch, options.pollInterval);
    return () => clearInterval(intervalId);
  }, [refetch, options.pollInterval]);

  return { entries, loading, error, refetch };
}
