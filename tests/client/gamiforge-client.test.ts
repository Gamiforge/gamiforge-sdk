import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GamiforgeClient } from '../../src/client/index';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('GamiforgeClient', () => {
  let client: GamiforgeClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new GamiforgeClient({
      runtimeBaseUrl: 'https://runtime.test.com',
      apiKey: 'gf_test1234567890test1234567890te',
      retry: { maxRetries: 0 },
    });
  });

  afterEach(() => {
    client.destroy();
  });

  describe('trackEvent', () => {
    it('sends correct request and maps response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          awards: [
            {
              type: 'xp',
              amount: 25,
              reason: 'Awarded 25 XP',
              rule_id: 'starter_activity_completed',
              guardrails_applied: [],
            },
          ],
          current_state: {
            xp: 125,
            level: 2,
            streaks: {
              daily_activity: { currentCount: 3, longestCount: 5 },
            },
            achievements: ['getting_started'],
          },
        }),
      });

      const result = await client.trackEvent({
        eventName: 'activity.completed',
        userId: 'user_123',
        metadata: { lessonId: 'L1' },
      });

      // Verify request
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://runtime.test.com/v1/events');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({
        event_name: 'activity.completed',
        user_id: 'user_123',
        metadata: { lessonId: 'L1' },
      });
      expect(init.headers['X-API-Key']).toBe('gf_test1234567890test1234567890te');

      // Verify response mapping (snake_case → camelCase)
      expect(result.awards).toHaveLength(1);
      expect(result.awards[0].type).toBe('xp');
      expect(result.awards[0].amount).toBe(25);
      expect(result.awards[0].ruleId).toBe('starter_activity_completed');
      expect(result.currentState.userId).toBe('user_123');
      expect(result.currentState.xp).toBe(125);
      expect(result.currentState.level).toBe(2);
      expect(result.currentState.streaks.daily_activity.currentCount).toBe(3);
      expect(result.currentState.achievements).toEqual(['getting_started']);
    });

    it('emits xp event on XP award', async () => {
      const xpHandler = vi.fn();
      client.events.on('xp', xpHandler);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          awards: [{ type: 'xp', amount: 50, reason: 'XP', rule_id: 'r1', guardrails_applied: [] }],
          current_state: { xp: 50, level: 1, streaks: {}, achievements: [] },
        }),
      });

      await client.trackEvent({ eventName: 'test', userId: 'u1' });

      expect(xpHandler).toHaveBeenCalledOnce();
      expect(xpHandler).toHaveBeenCalledWith({
        amount: 50,
        totalXp: 50,
        ruleId: 'r1',
        reason: 'XP',
      });
    });

    it('emits achievement event on achievement unlock', async () => {
      const achievementHandler = vi.fn();
      client.events.on('achievement', achievementHandler);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          awards: [
            { type: 'achievement', achievement_key: 'xp_500', reason: 'Unlocked', rule_id: 'SYSTEM', guardrails_applied: [] },
          ],
          current_state: { xp: 500, level: 3, streaks: {}, achievements: ['xp_500'] },
        }),
      });

      await client.trackEvent({ eventName: 'test', userId: 'u1' });

      expect(achievementHandler).toHaveBeenCalledWith({
        achievementKey: 'xp_500',
        reason: 'Unlocked',
      });
    });

    it('emits levelUp event on level-up', async () => {
      const levelUpHandler = vi.fn();
      client.events.on('levelUp', levelUpHandler);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          awards: [
            { type: 'level_up', amount: 3, reason: 'Leveled up to 3', rule_id: 'SYSTEM', guardrails_applied: [] },
          ],
          current_state: { xp: 350, level: 3, streaks: {}, achievements: [] },
        }),
      });

      await client.trackEvent({ eventName: 'test', userId: 'u1' });

      expect(levelUpHandler).toHaveBeenCalledWith({
        newLevel: 3,
        reason: 'Leveled up to 3',
      });
    });
  });

  describe('getUserState', () => {
    it('sends correct request and maps response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            user_id: 'user_123',
            xp: 450,
            level: 3,
            streaks: {
              daily_activity: { currentCount: 5, longestCount: 12 },
            },
            achievements: ['getting_started', 'xp_500'],
          },
        }),
      });

      const state = await client.getUserState('user_123');

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('https://runtime.test.com/v1/users/user_123/state');

      expect(state.userId).toBe('user_123');
      expect(state.xp).toBe(450);
      expect(state.level).toBe(3);
      expect(state.streaks.daily_activity.currentCount).toBe(5);
      expect(state.achievements).toEqual(['getting_started', 'xp_500']);
    });
  });

  describe('getLeaderboard', () => {
    it('sends correct request for XP leaderboard', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            type: 'xp',
            entries: [
              { user_id: 'u1', value: 2500, rank: 1 },
              { user_id: 'u2', value: 1800, rank: 2 },
            ],
          },
        }),
      });

      const result = await client.getLeaderboard({ type: 'xp', limit: 5 });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/v1/leaderboard');
      expect(url).toContain('type=xp');
      expect(url).toContain('limit=5');

      expect(result.type).toBe('xp');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0].userId).toBe('u1');
      expect(result.entries[0].value).toBe(2500);
      expect(result.entries[0].rank).toBe(1);
    });

    it('sends correct request for streak leaderboard', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            type: 'streak',
            streak_key: 'daily_activity',
            entries: [{ user_id: 'u1', value: 30, rank: 1 }],
          },
        }),
      });

      const result = await client.getLeaderboard({
        type: 'streak',
        streakKey: 'daily_activity',
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('type=streak');
      expect(url).toContain('key=daily_activity');

      expect(result.type).toBe('streak');
      expect(result.streakKey).toBe('daily_activity');
    });
  });

  describe('error handling', () => {
    it('throws ApiError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'AUTHENTICATION_ERROR', message: 'Invalid API key' },
        }),
      });

      await expect(
        client.trackEvent({ eventName: 'test', userId: 'u1' })
      ).rejects.toThrow('Invalid API key');
    });

    it('throws ApiError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' },
        }),
      });

      await expect(
        client.getUserState('nonexistent')
      ).rejects.toThrow('User not found');
    });
  });

  describe('destroy', () => {
    it('removes all event listeners', () => {
      const handler = vi.fn();
      client.events.on('xp', handler);
      client.destroy();
      client.events.emit('xp', { amount: 10, totalXp: 10, ruleId: 'r1', reason: 'test' });
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
