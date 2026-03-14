import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { GamiforgeContext } from '../context.js';
import type { Award } from '../../client/types.js';
import type { AchievementImportance } from './useAchievementFeed.js';

// ---------------------------------------------------------------------------
// Award feed item — one visual toast per award
// ---------------------------------------------------------------------------

export interface AwardFeedItem {
  /** Unique ID for React key */
  id: string;
  /** Award type from the runtime */
  type: Award['type'];
  /** XP amount (for xp awards) or new level (for level_up) */
  amount?: number;
  /** Achievement key (for achievement awards) */
  achievementKey?: string;
  /** Streak key (for streak_increment awards) */
  streakKey?: string;
  /** Human-readable reason from the rule engine */
  reason: string;
  /** Visual importance tier — drives confetti, glow, duration */
  importance: AchievementImportance;
  /** Epoch ms when this award was received */
  timestamp: number;
}

export interface UseAwardFeedReturn {
  /** Queue of recent awards (newest first) */
  awards: AwardFeedItem[];
  /** Remove a specific award from the feed */
  dismiss: (id: string) => void;
  /** Clear all awards from the feed */
  clearAll: () => void;
}

// ---------------------------------------------------------------------------
// Importance inference — same patterns as useAchievementFeed
// ---------------------------------------------------------------------------

const IMPORTANT_KEY_PATTERNS = [
  /^xp_\d{4,}$/,
  /milestone/i,
  /master/i,
  /champion/i,
  /elite/i,
];

const LEGENDARY_KEY_PATTERNS = [
  /^xp_\d{5,}$/,
  /legendary/i,
  /ultimate/i,
  /grandmaster/i,
];

function inferAchievementImportance(key: string): AchievementImportance {
  if (LEGENDARY_KEY_PATTERNS.some((p) => p.test(key))) return 'legendary';
  if (IMPORTANT_KEY_PATTERNS.some((p) => p.test(key))) return 'important';
  return 'normal';
}

function resolveImportance(
  award: Award,
  importanceMap?: Record<string, AchievementImportance>
): AchievementImportance {
  // Level-ups are always legendary
  if (award.type === 'level_up') return 'legendary';

  // Achievements use key-based inference or explicit map
  if (award.type === 'achievement' && award.achievementKey) {
    return importanceMap?.[award.achievementKey]
      ?? inferAchievementImportance(award.achievementKey);
  }

  // XP and streak are normal by default
  return 'normal';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

let feedCounter = 0;

/**
 * Subscribe to ALL award events from the SDK client. Returns a live feed
 * of every award received (XP, achievement, streak, level-up) suitable
 * for rendering in a unified toast stack.
 *
 * Must be used inside a `<GamiforgeProvider>`.
 */
export function useAwardFeed(
  importanceMap?: Record<string, AchievementImportance>
): UseAwardFeedReturn {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error('useAwardFeed must be used inside a <GamiforgeProvider>.');
  }

  const [awards, setAwards] = useState<AwardFeedItem[]>([]);
  const importanceMapRef = useRef(importanceMap);
  importanceMapRef.current = importanceMap;

  useEffect(() => {
    const unsubscribe = ctx.client.events.on('awards', (payload) => {
      const newItems: AwardFeedItem[] = payload.awards.map((award) => ({
        id: `award-${++feedCounter}`,
        type: award.type,
        amount: award.amount,
        achievementKey: award.achievementKey,
        streakKey: award.streakKey,
        reason: award.reason,
        importance: resolveImportance(award, importanceMapRef.current),
        timestamp: Date.now(),
      }));

      if (newItems.length > 0) {
        setAwards((prev) => [...newItems.reverse(), ...prev]);
      }
    });

    return unsubscribe;
  }, [ctx.client]);

  const dismiss = useCallback((id: string) => {
    setAwards((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAwards([]);
  }, []);

  return { awards, dismiss, clearAll };
}
