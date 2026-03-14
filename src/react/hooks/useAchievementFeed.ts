import { useContext, useEffect, useState, useCallback } from 'react';
import { GamiforgeContext } from '../context.js';

// ---------------------------------------------------------------------------
// Importance tiers — determines visual treatment (confetti, glow, etc.)
// ---------------------------------------------------------------------------

export type AchievementImportance = 'normal' | 'important' | 'legendary';

export interface AchievementFeedItem {
  achievementKey: string;
  reason: string;
  timestamp: number;
  importance: AchievementImportance;
}

export interface UseAchievementFeedReturn {
  /** Queue of recently unlocked achievements (newest first) */
  achievements: AchievementFeedItem[];

  /** Remove a specific achievement from the feed (e.g. after it's been displayed) */
  dismiss: (achievementKey: string) => void;

  /** Clear all achievements from the feed */
  clearAll: () => void;
}

/**
 * Well-known achievement key patterns that indicate higher importance.
 * Tenants can override via the `importanceMap` prop on `<AchievementToast>`.
 */
const IMPORTANT_KEY_PATTERNS = [
  /^xp_\d{4,}$/,       // xp_1000, xp_5000, etc. — large XP milestones
  /milestone/i,
  /master/i,
  /champion/i,
  /elite/i,
];

const LEGENDARY_KEY_PATTERNS = [
  /^xp_\d{5,}$/,       // xp_10000+ — massive XP milestones
  /legendary/i,
  /ultimate/i,
  /grandmaster/i,
];

function inferImportance(key: string): AchievementImportance {
  if (LEGENDARY_KEY_PATTERNS.some((p) => p.test(key))) return 'legendary';
  if (IMPORTANT_KEY_PATTERNS.some((p) => p.test(key))) return 'important';
  return 'normal';
}

/**
 * Subscribe to achievement unlock events. Returns a live feed of
 * recently unlocked achievements that can be rendered as toasts.
 *
 * Items remain in the feed until explicitly dismissed.
 *
 * Must be used inside a `<GamiforgeProvider>`.
 */
export function useAchievementFeed(
  importanceMap?: Record<string, AchievementImportance>
): UseAchievementFeedReturn {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'useAchievementFeed must be used inside a <GamiforgeProvider>.'
    );
  }

  const [achievements, setAchievements] = useState<AchievementFeedItem[]>([]);

  // Subscribe to achievement events from the emitter
  useEffect(() => {
    const unsubscribe = ctx.client.events.on('achievement', (payload) => {
      const explicitImportance = importanceMap?.[payload.achievementKey];
      const importance = explicitImportance ?? inferImportance(payload.achievementKey);

      const item: AchievementFeedItem = {
        achievementKey: payload.achievementKey,
        reason: payload.reason,
        timestamp: Date.now(),
        importance,
      };
      setAchievements((prev) => [item, ...prev]);
    });

    return unsubscribe;
  }, [ctx.client, importanceMap]);

  const dismiss = useCallback((achievementKey: string) => {
    setAchievements((prev) =>
      prev.filter((a) => a.achievementKey !== achievementKey)
    );
  }, []);

  const clearAll = useCallback(() => {
    setAchievements([]);
  }, []);

  return { achievements, dismiss, clearAll };
}
