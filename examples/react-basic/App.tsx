/**
 * Gamiforge SDK — React Example
 *
 * Demonstrates how to integrate the full Gamiforge UI into a React app.
 */

import React from 'react';
import {
  GamiforgeProvider,
  useTrackEvent,
  useUserState,
  useXPProgress,
  ProgressBar,
  AchievementToast,
  XPGainIndicator,
  LevelUpModal,
  StreakIndicator,
  Leaderboard,
  UserProgressWidget,
} from '@gamiforge/sdk/react';

// Don't forget to import styles in your app entry point:
// import '@gamiforge/sdk/styles.css';

function App() {
  // Your app's auth provides the user ID
  const currentUserId = 'user_abc123';

  return (
    <GamiforgeProvider
      config={{
        runtimeBaseUrl: 'https://your-runtime.gamiforge.io',
        apiKey: 'gf_your_api_key_here',
      }}
      userId={currentUserId}
      theme={{
        colors: { primary: '#6C5CE7' },
        borderRadius: '12px',
      }}
    >
      {/* Event-driven overlays — mount once at the top level */}
      <AchievementToast position="top-right" duration={5000} />
      <XPGainIndicator position="top-right" />
      <LevelUpModal />

      {/* Your app content */}
      <Dashboard />
    </GamiforgeProvider>
  );
}

function Dashboard() {
  const { trackEvent, isTracking } = useTrackEvent();
  const { xp, level, achievements } = useUserState();
  const { progress, xpToNextLevel } = useXPProgress();

  const handleCompleteLesson = async () => {
    const result = await trackEvent('activity.completed', {
      lessonId: 'lesson_42',
      score: 95,
    });
    console.log('Awards:', result.awards);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1>Gamification Demo</h1>

      {/* Composite widget showing all user stats */}
      <UserProgressWidget title="Your Progress" />

      <hr style={{ margin: '24px 0' }} />

      {/* Individual components */}
      <h2>XP Progress</h2>
      <ProgressBar showLabel showPercentage={false} animated height={10} />
      <p>
        {xpToNextLevel > 0
          ? `${xpToNextLevel} XP to next level`
          : 'Max level reached!'}
      </p>

      <h2>Streak</h2>
      <StreakIndicator showLongest />

      <h2>Action</h2>
      <button onClick={handleCompleteLesson} disabled={isTracking}>
        {isTracking ? 'Tracking...' : 'Complete Lesson'}
      </button>

      <h2>Leaderboard</h2>
      <Leaderboard
        type="xp"
        limit={10}
        highlightUserId="user_abc123"
        pollInterval={30000}
      />
    </div>
  );
}

export default App;
