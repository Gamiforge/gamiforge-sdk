// ---------------------------------------------------------------------------
// SDK Configuration
// ---------------------------------------------------------------------------

export interface GamiforgeConfig {
  /** Base URL of the provisioned Gamiforge Runtime instance */
  runtimeBaseUrl: string;

  /** API key issued by the Gamiforge platform (starts with "gf_") */
  apiKey: string;

  /** Optional environment label for logging/debugging */
  environment?: string;

  /** Retry configuration */
  retry?: {
    /** Maximum number of retries for failed requests (default: 2) */
    maxRetries?: number;
    /** Initial backoff delay in milliseconds (default: 500) */
    backoffMs?: number;
  };

  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

// ---------------------------------------------------------------------------
// Level Thresholds (for progress calculation)
// ---------------------------------------------------------------------------

export interface LevelThreshold {
  level: number;
  xpRequired: number;
}

/** Default level thresholds matching the Gamiforge starter config */
export const DEFAULT_LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, xpRequired: 0 },
  { level: 2, xpRequired: 100 },
  { level: 3, xpRequired: 300 },
  { level: 4, xpRequired: 600 },
  { level: 5, xpRequired: 1000 },
];

// ---------------------------------------------------------------------------
// Event Tracking
// ---------------------------------------------------------------------------

export interface TrackEventParams {
  /** Event name matching a rule in the runtime (e.g. "activity.completed") */
  eventName: string;

  /** External user ID (your application's user identifier) */
  userId: string;

  /** ISO 8601 timestamp — defaults to now if omitted */
  timestamp?: string;

  /** Arbitrary metadata passed to the rule engine for condition evaluation */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Award (returned from POST /v1/events)
// ---------------------------------------------------------------------------

export type AwardType = 'xp' | 'achievement' | 'streak_increment' | 'level_up';

export interface Award {
  type: AwardType;
  amount?: number;
  achievementKey?: string;
  streakKey?: string;
  reason: string;
  ruleId: string;
  guardrailsApplied: string[];
}

// ---------------------------------------------------------------------------
// Streak State
// ---------------------------------------------------------------------------

export interface StreakState {
  currentCount: number;
  longestCount: number;
}

// ---------------------------------------------------------------------------
// User Gamification State
// ---------------------------------------------------------------------------

export interface UserState {
  userId: string;
  xp: number;
  level: number;
  streaks: Record<string, StreakState>;
  achievements: string[];
}

// ---------------------------------------------------------------------------
// Event Response (from POST /v1/events)
// ---------------------------------------------------------------------------

export interface EventResponse {
  awards: Award[];
  currentState: UserState;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  userId: string;
  value: number;
  rank: number;
}

export interface LeaderboardParams {
  type: 'xp' | 'streak';
  /** Required when type is "streak" */
  streakKey?: string;
  /** Number of entries (1–100, default 10) */
  limit?: number;
  /** Time window in days for XP leaderboards (e.g. 7 for weekly) */
  windowDays?: number;
}

export interface LeaderboardResponse {
  type: 'xp' | 'streak';
  streakKey?: string;
  entries: LeaderboardEntry[];
}

// ---------------------------------------------------------------------------
// Appearance (tenant-configured via admin dashboard)
// ---------------------------------------------------------------------------

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export type ThemePreset = 'default' | 'ocean' | 'sunset' | 'dark' | 'minimal' | 'custom';

export interface AppearanceCustomColors {
  primary?: string;
  primaryLight?: string;
  success?: string;
  warning?: string;
  danger?: string;
  background?: string;
  surface?: string;
  text?: string;
  textSecondary?: string;
  border?: string;
}

export interface AppearanceConfig {
  toastPosition: ToastPosition;
  theme: {
    preset: ThemePreset;
    customColors?: AppearanceCustomColors;
  };
  /** Map of achievement key -> base64 data URI for custom icons */
  achievementImages?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Raw API Shapes (wire format from the runtime — snake_case)
// ---------------------------------------------------------------------------

/** @internal */
export interface RawAwardResponse {
  type: string;
  amount?: number;
  achievement_key?: string;
  streak_key?: string;
  reason: string;
  rule_id: string;
  guardrails_applied: string[];
}

/** @internal */
export interface RawEventResponse {
  awards: RawAwardResponse[];
  current_state: {
    xp: number;
    level: number;
    streaks: Record<string, { currentCount: number; longestCount: number }>;
    achievements: string[];
  };
}

/** @internal */
export interface RawUserStateResponse {
  success: boolean;
  data: {
    user_id: string;
    xp: number;
    level: number;
    streaks: Record<string, { currentCount: number; longestCount: number }>;
    achievements: string[];
  };
}

/** @internal */
export interface RawLeaderboardResponse {
  success: boolean;
  data: {
    type: 'xp' | 'streak';
    streak_key?: string;
    entries: Array<{
      user_id: string;
      value: number;
      rank: number;
    }>;
  };
}

/** @internal */
export interface RawApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
