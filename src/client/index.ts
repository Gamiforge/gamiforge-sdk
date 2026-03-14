import { resolveConfig, type ResolvedConfig } from './config.js';
import { HttpTransport } from './http.js';
import { ApiError } from './errors.js';
import { GamiforgeEventEmitter } from '../events/emitter.js';
import type {
  GamiforgeConfig,
  TrackEventParams,
  EventResponse,
  UserState,
  Award,
  LeaderboardParams,
  LeaderboardResponse,
  AppearanceConfig,
  RawEventResponse,
  RawUserStateResponse,
  RawLeaderboardResponse,
} from './types.js';

// ---------------------------------------------------------------------------
// GamiforgeClient — Framework-Agnostic Runtime Client
// ---------------------------------------------------------------------------

export class GamiforgeClient {
  /** @internal */ readonly _config: ResolvedConfig;
  /** @internal */ readonly _http: HttpTransport;
  /** @internal */ readonly _emitter: GamiforgeEventEmitter;

  constructor(config: GamiforgeConfig) {
    this._config = resolveConfig(config);
    this._http = new HttpTransport(this._config);
    this._emitter = new GamiforgeEventEmitter();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Track a gamification event. The runtime evaluates rules and returns
   * any awards earned plus the user's updated state.
   *
   * If the tenant's monthly event quota has been exceeded, this emits a
   * `quotaExceeded` event instead of throwing, and returns an empty
   * awards list with the user's last known state.
   */
  async trackEvent(params: TrackEventParams): Promise<EventResponse> {
    try {
      const raw = await this._http.request<RawEventResponse>({
        method: 'POST',
        path: '/v1/events',
        body: {
          event_name: params.eventName,
          user_id: params.userId,
          timestamp: params.timestamp,
          metadata: params.metadata,
        },
      });

      const result = this.mapEventResponse(raw, params.userId);

      // Emit granular events for UI components
      this.emitAwardEvents(result.awards, result.currentState);

      return result;
    } catch (err) {
      // Handle QUOTA_EXCEEDED gracefully — emit event, don't throw
      if (err instanceof ApiError && err.code === 'QUOTA_EXCEEDED') {
        const errorBody = err.responseBody as {
          error?: {
            limit?: number;
            resetDate?: string;
            message?: string;
          };
        } | undefined;

        this._emitter.emit('quotaExceeded', {
          message: errorBody?.error?.message ?? err.message,
          limit: errorBody?.error?.limit ?? 0,
          resetDate: errorBody?.error?.resetDate,
        });

        // Return an empty result so the caller doesn't crash
        return {
          awards: [],
          currentState: {
            userId: params.userId,
            xp: 0,
            level: 1,
            streaks: {},
            achievements: [],
          },
        };
      }

      throw err;
    }
  }

  /**
   * Retrieve the current gamification state for a user.
   */
  async getUserState(userId: string): Promise<UserState> {
    const raw = await this._http.request<RawUserStateResponse>({
      method: 'GET',
      path: `/v1/users/${encodeURIComponent(userId)}/state`,
    });

    const state = this.mapUserState(raw.data);

    // Emit state update
    this._emitter.emit('stateUpdate', { state });

    return state;
  }

  /**
   * Fetch the leaderboard (XP or streak ranking).
   */
  async getLeaderboard(params: LeaderboardParams): Promise<LeaderboardResponse> {
    const query: Record<string, string | number | undefined> = {
      type: params.type,
      limit: params.limit,
    };

    if (params.type === 'streak' && params.streakKey) {
      query.key = params.streakKey;
    }

    if (params.type === 'xp' && params.windowDays) {
      query.window = params.windowDays;
    }

    const raw = await this._http.request<RawLeaderboardResponse>({
      method: 'GET',
      path: '/v1/leaderboard',
      query,
    });

    return {
      type: raw.data.type,
      streakKey: raw.data.streak_key,
      entries: raw.data.entries.map((e) => ({
        userId: e.user_id,
        value: e.value,
        rank: e.rank,
      })),
    };
  }

  /**
   * Fetch the tenant's appearance configuration (toast position, theme).
   * Returns defaults if no appearance has been configured.
   */
  async getAppearance(): Promise<AppearanceConfig> {
    const raw = await this._http.request<{
      success: boolean;
      data: AppearanceConfig;
    }>({
      method: 'GET',
      path: '/v1/appearance',
    });

    return raw.data;
  }

  /**
   * Access the internal event emitter for subscribing to award events.
   * Used by React hooks — rarely needed by customers directly.
   */
  get events(): GamiforgeEventEmitter {
    return this._emitter;
  }

  /**
   * Clean up resources (cancel pending requests, remove listeners).
   */
  destroy(): void {
    this._emitter.removeAll();
  }

  // -------------------------------------------------------------------------
  // Internal Mapping
  // -------------------------------------------------------------------------

  /** @internal */
  private mapEventResponse(raw: RawEventResponse, userId: string): EventResponse {
    return {
      awards: raw.awards.map((a) => this.mapAward(a)),
      currentState: {
        userId,
        xp: raw.current_state.xp,
        level: raw.current_state.level,
        streaks: raw.current_state.streaks,
        achievements: raw.current_state.achievements,
      },
    };
  }

  /** @internal */
  private mapAward(raw: RawEventResponse['awards'][number]): Award {
    return {
      type: raw.type as Award['type'],
      amount: raw.amount,
      achievementKey: raw.achievement_key,
      streakKey: raw.streak_key,
      reason: raw.reason,
      ruleId: raw.rule_id,
      guardrailsApplied: raw.guardrails_applied,
    };
  }

  /** @internal */
  private mapUserState(raw: RawUserStateResponse['data']): UserState {
    return {
      userId: raw.user_id,
      xp: raw.xp,
      level: raw.level,
      streaks: raw.streaks,
      achievements: raw.achievements,
    };
  }

  /** @internal */
  private emitAwardEvents(awards: Award[], state: UserState): void {
    // Emit bulk awards event
    this._emitter.emit('awards', { awards, state });

    // Emit state update
    this._emitter.emit('stateUpdate', { state });

    // Emit individual award-type events for UI components
    for (const award of awards) {
      switch (award.type) {
        case 'xp':
          this._emitter.emit('xp', {
            amount: award.amount ?? 0,
            totalXp: state.xp,
            ruleId: award.ruleId,
            reason: award.reason,
          });
          break;

        case 'achievement':
          if (award.achievementKey) {
            this._emitter.emit('achievement', {
              achievementKey: award.achievementKey,
              reason: award.reason,
            });
          }
          break;

        case 'level_up':
          this._emitter.emit('levelUp', {
            newLevel: award.amount ?? state.level,
            reason: award.reason,
          });
          break;

        case 'streak_increment':
          if (award.streakKey) {
            this._emitter.emit('streak', {
              streakKey: award.streakKey,
              reason: award.reason,
            });
          }
          break;
      }
    }
  }
}
