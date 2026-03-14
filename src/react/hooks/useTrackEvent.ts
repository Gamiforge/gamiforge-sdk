import { useContext, useCallback, useState } from 'react';
import { GamiforgeContext } from '../context.js';
import type { EventResponse } from '../../client/types.js';

export interface UseTrackEventReturn {
  /**
   * Track a gamification event. Awards are emitted to the internal event bus
   * and user state is updated in context automatically.
   */
  trackEvent: (
    eventName: string,
    metadata?: Record<string, unknown>
  ) => Promise<EventResponse>;

  /** Whether a trackEvent call is currently in flight */
  isTracking: boolean;
}

/**
 * Returns a `trackEvent` function that sends events to the Gamiforge Runtime
 * and automatically updates the provider's user state.
 *
 * UI components (`AchievementToast`, `XPGainIndicator`, `LevelUpModal`) will
 * automatically react to the awards returned by this call.
 *
 * Must be used inside a `<GamiforgeProvider>`.
 */
export function useTrackEvent(): UseTrackEventReturn {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'useTrackEvent must be used inside a <GamiforgeProvider>. ' +
        'Wrap your component tree with <GamiforgeProvider config={...} userId="...">.'
    );
  }

  const [isTracking, setIsTracking] = useState(false);

  const trackEvent = useCallback(
    async (
      eventName: string,
      metadata?: Record<string, unknown>
    ): Promise<EventResponse> => {
      setIsTracking(true);
      try {
        const result = await ctx.client.trackEvent({
          eventName,
          userId: ctx.userId,
          metadata,
        });

        // Optimistically update state in the provider
        ctx.setState(result.currentState);

        return result;
      } finally {
        setIsTracking(false);
      }
    },
    [ctx]
  );

  return { trackEvent, isTracking };
}
