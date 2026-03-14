/**
 * Gamiforge SDK — Node.js (Server-Side) Example
 *
 * This shows how to use the SDK from a backend service (Express, Next.js API route, etc.)
 * to track events on behalf of users.
 *
 * Usage:
 *   npx tsx examples/node-basic/index.ts
 */

import { GamiforgeClient } from '@gamiforge/sdk';

async function main() {
  // 1. Initialize the client with your Runtime URL and API key
  const client = new GamiforgeClient({
    runtimeBaseUrl: 'https://your-runtime.gamiforge.io',
    apiKey: 'gf_your_api_key_here',
  });

  try {
    // 2. Track an event (e.g., user completed a lesson)
    const result = await client.trackEvent({
      eventName: 'activity.completed',
      userId: 'user_abc123',
      metadata: {
        lessonId: 'lesson_42',
        score: 95,
      },
    });

    console.log('Awards earned:', result.awards);
    console.log('Current state:', result.currentState);

    // 3. Fetch user state independently
    const state = await client.getUserState('user_abc123');
    console.log('User XP:', state.xp);
    console.log('User Level:', state.level);
    console.log('Streaks:', state.streaks);
    console.log('Achievements:', state.achievements);

    // 4. Fetch leaderboard
    const leaderboard = await client.getLeaderboard({
      type: 'xp',
      limit: 5,
    });
    console.log('Leaderboard:', leaderboard.entries);
  } catch (error) {
    console.error('Gamiforge error:', error);
  } finally {
    client.destroy();
  }
}

main();
