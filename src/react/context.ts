import { createContext } from 'react';
import type { GamiforgeClient } from '../client/index.js';
import type { UserState, LevelThreshold, AppearanceConfig, ToastPosition } from '../client/types.js';

// ---------------------------------------------------------------------------
// Context Value
// ---------------------------------------------------------------------------

export interface GamiforgeContextValue {
  /** The underlying framework-agnostic client */
  client: GamiforgeClient;

  /** Current user ID */
  userId: string;

  /** Current user gamification state (null while loading) */
  state: UserState | null;

  /** Whether the initial state fetch is in progress */
  loading: boolean;

  /** Error from the last state fetch, if any */
  error: Error | null;

  /** Level thresholds for progress calculations */
  levelThresholds: LevelThreshold[];

  /** Re-fetch user state from the runtime */
  refetch: () => Promise<void>;

  /** Update state locally (used internally after trackEvent) */
  setState: (state: UserState) => void;

  /** Tenant appearance configuration (fetched on mount) */
  appearance: AppearanceConfig | null;

  /** Convenience accessor for toast position from appearance config */
  toastPosition: ToastPosition;

  /** Map of achievement key -> base64 data URI (from org appearance config) */
  achievementImages: Record<string, string>;
}

// ---------------------------------------------------------------------------
// React Context
// ---------------------------------------------------------------------------

export const GamiforgeContext = createContext<GamiforgeContextValue | null>(null);
GamiforgeContext.displayName = 'GamiforgeContext';
