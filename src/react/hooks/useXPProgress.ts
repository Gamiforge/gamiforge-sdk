import { useContext, useMemo } from 'react';
import { GamiforgeContext } from '../context.js';

export interface UseXPProgressReturn {
  /** Current total XP */
  xp: number;

  /** Current level */
  level: number;

  /** XP required to reach the current level */
  xpForCurrentLevel: number;

  /** XP required to reach the next level (Infinity if at max level) */
  xpForNextLevel: number;

  /** XP needed to level up from current (xpForNextLevel - xp) */
  xpToNextLevel: number;

  /** Progress from current level to next (0–1). 1 if at max level. */
  progress: number;

  /** Whether user is at the maximum configured level */
  isMaxLevel: boolean;
}

/**
 * Calculate XP progress toward the next level based on the user's
 * current state and the configured level thresholds.
 *
 * Must be used inside a `<GamiforgeProvider>`.
 */
export function useXPProgress(): UseXPProgressReturn {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'useXPProgress must be used inside a <GamiforgeProvider>.'
    );
  }

  const { state, levelThresholds } = ctx;

  return useMemo(() => {
    const xp = state?.xp ?? 0;
    const level = state?.level ?? 1;

    // Sort thresholds ascending
    const sorted = [...levelThresholds].sort((a, b) => a.level - b.level);

    // Find current and next thresholds
    const currentThreshold = sorted.find((t) => t.level === level);
    const nextThreshold = sorted.find((t) => t.level === level + 1);

    const xpForCurrentLevel = currentThreshold?.xpRequired ?? 0;
    const xpForNextLevel = nextThreshold?.xpRequired ?? Infinity;
    const isMaxLevel = !nextThreshold;

    let progress: number;
    let xpToNextLevel: number;

    if (isMaxLevel) {
      progress = 1;
      xpToNextLevel = 0;
    } else {
      const range = xpForNextLevel - xpForCurrentLevel;
      const gained = xp - xpForCurrentLevel;
      progress = range > 0 ? Math.min(Math.max(gained / range, 0), 1) : 1;
      xpToNextLevel = Math.max(xpForNextLevel - xp, 0);
    }

    return {
      xp,
      level,
      xpForCurrentLevel,
      xpForNextLevel,
      xpToNextLevel,
      progress,
      isMaxLevel,
    };
  }, [state?.xp, state?.level, levelThresholds]);
}
