import type { Award, UserState } from '../client/types.js';

// ---------------------------------------------------------------------------
// Event Map — all SDK-internal events that UI components can subscribe to
// ---------------------------------------------------------------------------

export interface GamiforgeEventMap {
  /** Fired when XP is awarded */
  xp: { amount: number; totalXp: number; ruleId: string; reason: string };

  /** Fired when an achievement is unlocked */
  achievement: { achievementKey: string; reason: string };

  /** Fired when the user levels up */
  levelUp: { newLevel: number; reason: string };

  /** Fired when a streak is incremented */
  streak: { streakKey: string; reason: string };

  /** Fired when user state is updated (after any event or manual refetch) */
  stateUpdate: { state: UserState };

  /** Fired when any awards are received (raw award list) */
  awards: { awards: Award[]; state: UserState };

  /** Fired when the tenant's monthly event quota has been exceeded */
  quotaExceeded: { message: string; limit: number; resetDate?: string };
}

export type GamiforgeEventName = keyof GamiforgeEventMap;

type Listener<T> = (payload: T) => void;

// ---------------------------------------------------------------------------
// Typed Event Emitter
// ---------------------------------------------------------------------------

export class GamiforgeEventEmitter {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on<K extends GamiforgeEventName>(
    event: K,
    listener: Listener<GamiforgeEventMap[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(listener as Listener<unknown>);

    return () => {
      set.delete(listener as Listener<unknown>);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emit an event to all listeners.
   */
  emit<K extends GamiforgeEventName>(event: K, payload: GamiforgeEventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(payload);
      } catch {
        // Swallow listener errors to avoid breaking the SDK flow
      }
    }
  }

  /**
   * Remove all listeners for all events.
   */
  removeAll(): void {
    this.listeners.clear();
  }
}
