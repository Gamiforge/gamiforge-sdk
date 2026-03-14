// ---------------------------------------------------------------------------
// @gamiforge/sdk — Public API (framework-agnostic)
// ---------------------------------------------------------------------------

// Client
export { GamiforgeClient } from './client/index.js';

// Types
export type {
  GamiforgeConfig,
  TrackEventParams,
  EventResponse,
  UserState,
  Award,
  AwardType,
  StreakState,
  LeaderboardEntry,
  LeaderboardParams,
  LeaderboardResponse,
  LevelThreshold,
} from './client/types.js';

export { DEFAULT_LEVEL_THRESHOLDS } from './client/types.js';

// Errors
export {
  GamiforgeError,
  ApiError,
  NetworkError,
  TimeoutError,
  ConfigError,
} from './client/errors.js';

// Event Emitter (for advanced usage)
export { GamiforgeEventEmitter } from './events/emitter.js';
export type { GamiforgeEventMap, GamiforgeEventName } from './events/emitter.js';
