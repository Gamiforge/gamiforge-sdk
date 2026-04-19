# @gamiforge/sdk

Add XP, achievements, streaks, leaderboards, and reward UI to your app in minutes.

`@gamiforge/sdk` is the official Gamiforge SDK for adding progression systems to SaaS, learning, productivity, and community apps. Use the hosted Gamiforge platform by default, get your API key, and start tracking events right away.

Built-in React components help you ship polished reward UI fast, and built-in guardrails help you avoid unhealthy engagement mechanics.

<p align="center">
  <img src="https://www.indiescapegames.com/gamiforge-logo.png" width="300" alt="Gamiforge Logo">
</p>

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [React Integration](#react-integration)
  - [Provider Setup](#provider-setup)
  - [Tracking Events](#tracking-events)
  - [Hooks](#hooks)
  - [UI Components](#ui-components)
  - [Theming](#theming)
- [Node.js / Server-Side Usage](#nodejs--server-side-usage)
- [Error Handling](#error-handling)
- [TypeScript](#typescript)
- [License](#license)

---

## Prerequisites

To get started, create a Gamiforge account and create an app in the hosted dashboard. Most developers should use the hosted version first. **[Sign up at www.gamiforge.com](https://www.gamiforge.com)** to get started.

Gamiforge offers two hosting options:

| Option | Description |
|---|---|
| **Hosted** | The default path for most developers. Gamiforge provisions and manages the Runtime for you, and your `runtimeBaseUrl` is provided in the dashboard after you create an app. |
| **Self-Hosted** | Available for advanced and enterprise use cases when you need to deploy and run the Runtime in your own infrastructure. |

Once your account is set up, create an application in the [dashboard](https://www.gamiforge.com) to get your `runtimeBaseUrl` and `apiKey`.

Your goal for the quickstart is simple: install the SDK, track one event, and see a reward in your app.

---

## Installation

```bash
npm install @gamiforge/sdk
# or
yarn add @gamiforge/sdk
# or
pnpm add @gamiforge/sdk
```

React peer dependencies (required only for React integration):

```bash
npm install react react-dom
```

---

## Quick Start

### React

```tsx
// 1. Import styles once in your app entry point
import '@gamiforge/sdk/styles.css';

// 2. Wrap your app with the provider
import { GamiforgeProvider } from '@gamiforge/sdk/react';

function App() {
  return (
    <GamiforgeProvider
      config={{
        runtimeBaseUrl: 'https://your-runtime.gamiforge.io',
        apiKey: 'gf_your_api_key_here',
      }}
      userId={currentUser.id}
    >
      <YourApp />
    </GamiforgeProvider>
  );
}

// 3. Track events from any component
import { useTrackEvent } from '@gamiforge/sdk/react';

function LessonButton() {
  const { trackEvent, isTracking } = useTrackEvent();

  return (
    <button
      onClick={() => trackEvent('activity.completed', { lessonId: 'lesson_42' })}
      disabled={isTracking}
    >
      Complete Lesson
    </button>
  );
}
```

### Node.js

```ts
import { GamiforgeClient } from '@gamiforge/sdk';

const client = new GamiforgeClient({
  runtimeBaseUrl: 'https://your-runtime.gamiforge.io',
  apiKey: 'gf_your_api_key_here',
});

const result = await client.trackEvent({
  eventName: 'activity.completed',
  userId: 'user_abc123',
  metadata: { lessonId: 'lesson_42', score: 95 },
});

console.log(result.awards);       // XP, achievements, level-ups earned
console.log(result.currentState); // Updated user state
```

---

## React Integration

### Provider Setup

Wrap your component tree with `<GamiforgeProvider>` near the root of your app. It initializes the SDK client, fetches the user's current state, and provides context to all hooks and components.

```tsx
import { GamiforgeProvider } from '@gamiforge/sdk/react';

<GamiforgeProvider
  config={{
    runtimeBaseUrl: 'https://your-runtime.gamiforge.io', // Runtime URL from your Gamiforge dashboard
    apiKey: 'gf_your_api_key_here',                      // API key from your Gamiforge dashboard
    timeout: 10000,                                       // Request timeout in ms (default: 10000)
    retry: { maxRetries: 2, backoffMs: 500 },            // Retry config (optional)
  }}
  userId={currentUser.id}            // Your app's user identifier
  levelThresholds={myLevelConfig}    // Optional — overrides the default 5-level config
  theme={{ colors: { primary: '#6C5CE7' } }}  // Optional — see Theming
>
  {/* Mount toast/overlay components once at this level */}
  <AchievementToast />
  <XPGainIndicator />
  <LevelUpModal />
  <AwardToast />

  <YourApp />
</GamiforgeProvider>
```

**Next.js** — import styles in your root `layout.tsx` and mark the provider as a Client Component:

```tsx
// app/layout.tsx
import '@gamiforge/sdk/styles.css';

// components/GamificationWrapper.tsx
'use client';
import { GamiforgeProvider } from '@gamiforge/sdk/react';

export function GamificationWrapper({ userId, children }) {
  return (
    <GamiforgeProvider
      config={{
        runtimeBaseUrl: process.env.NEXT_PUBLIC_GAMIFORGE_RUNTIME_URL!,
        apiKey: process.env.NEXT_PUBLIC_GAMIFORGE_API_KEY!,
      }}
      userId={userId}
    >
      <AchievementToast />
      <XPGainIndicator />
      <LevelUpModal />
      {children}
    </GamiforgeProvider>
  );
}
```

---

### Tracking Events

Use `useTrackEvent` to send events to the Gamiforge Runtime. Awards (XP, achievements, level-ups) are automatically emitted to any mounted UI components.

```tsx
import { useTrackEvent } from '@gamiforge/sdk/react';

function ActivityButton() {
  const { trackEvent, isTracking } = useTrackEvent();

  const handleClick = async () => {
    const result = await trackEvent('activity.completed', {
      // Optional metadata — sent with the event for server-side processing
      lessonId: 'lesson_42',
      score: 95,
    });

    console.log(result.awards);       // Awards earned this event
    console.log(result.currentState); // User's updated state
  };

  return (
    <button onClick={handleClick} disabled={isTracking}>
      {isTracking ? 'Saving...' : 'Complete Activity'}
    </button>
  );
}
```

---

### Hooks

All hooks must be used inside a `<GamiforgeProvider>`.

#### `useUserState`

Access the current user's gamification state.

```tsx
import { useUserState } from '@gamiforge/sdk/react';

const { xp, level, achievements, streaks, loading, error, refetch } = useUserState();
```

| Return value | Type | Description |
|---|---|---|
| `xp` | `number` | Total XP earned |
| `level` | `number` | Current level |
| `achievements` | `string[]` | Unlocked achievement keys |
| `streaks` | `Record<string, StreakState>` | Active streaks by key |
| `loading` | `boolean` | True while fetching initial state |
| `error` | `Error \| null` | Last fetch error, if any |
| `refetch` | `() => Promise<void>` | Manually refresh state |

#### `useTrackEvent`

```tsx
const { trackEvent, isTracking } = useTrackEvent();

// trackEvent(eventName, metadata?) => Promise<EventResponse>
await trackEvent('purchase.completed', { amount: 49.99 });
```

#### `useXPProgress`

Calculate progress toward the next level.

```tsx
const { xp, level, progress, xpToNextLevel, isMaxLevel } = useXPProgress();

// progress: 0–1 (fraction of the way to the next level)
// xpToNextLevel: XP remaining until level-up
```

#### `useLeaderboard`

```tsx
import { useLeaderboard } from '@gamiforge/sdk/react';

const { entries, loading, error } = useLeaderboard({
  type: 'xp',        // 'xp' | 'streak'
  limit: 10,
  windowDays: 7,     // Optional: rolling window for XP leaderboards
  pollInterval: 30000, // Optional: auto-refresh in ms
});

// entries: Array<{ userId, value, rank }>
```

#### `useAchievementFeed`

Subscribe to achievement unlock events.

```tsx
import { useAchievementFeed } from '@gamiforge/sdk/react';

const { feed } = useAchievementFeed({ maxItems: 5 });

// feed: Array<{ achievementKey, reason, importance, receivedAt }>
```

#### `useAwardFeed`

Subscribe to the raw award queue (XP, achievements, level-ups, streaks).

```tsx
import { useAwardFeed } from '@gamiforge/sdk/react';

const { feed } = useAwardFeed();

// feed: Array<{ award, state, receivedAt }>
```

#### `useGamiforgeClient`

Access the underlying `GamiforgeClient` directly for advanced use cases.

```tsx
import { useGamiforgeClient } from '@gamiforge/sdk/react';

const client = useGamiforgeClient();
const leaderboard = await client.getLeaderboard({ type: 'xp', limit: 5 });
```

---

### UI Components

Import `@gamiforge/sdk/styles.css` once in your app for all components to render correctly.

#### `<AchievementToast>`

Automatically pops up when an achievement is unlocked.

```tsx
<AchievementToast
  position="top-right"  // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  duration={5000}       // Display duration in ms
/>
```

#### `<XPGainIndicator>`

Floating "+XP" animation that fires when XP is awarded.

```tsx
<XPGainIndicator position="top-right" />
```

#### `<LevelUpModal>`

Full-screen modal that appears when the user levels up.

```tsx
<LevelUpModal />
```

#### `<AwardToast>`

Generic toast for any award type.

```tsx
<AwardToast position="bottom-right" duration={4000} />
```

#### `<ProgressBar>`

XP progress bar toward the next level.

```tsx
<ProgressBar
  showLabel       // Show "Level N" label
  showPercentage  // Show percentage text
  animated        // Animate on change
  height={8}      // Bar height in px
/>
```

#### `<StreakIndicator>`

Displays the user's current streak.

```tsx
<StreakIndicator
  streakKey="daily_login"  // Optional: specific streak to display
  showLongest              // Also show all-time longest streak
/>
```

#### `<Leaderboard>`

Ranked list of users by XP or streak.

```tsx
<Leaderboard
  type="xp"
  limit={10}
  highlightUserId={currentUser.id}  // Highlights this user's row
  pollInterval={30000}              // Auto-refresh in ms
/>
```

#### `<UserProgressWidget>`

Composite card combining XP bar, level, streak, and achievement count.

```tsx
<UserProgressWidget title="Your Progress" />
```

#### `<ConfettiBurst>`

Trigger a confetti animation programmatically.

```tsx
import { ConfettiBurst } from '@gamiforge/sdk/react';

<ConfettiBurst active={showConfetti} onComplete={() => setShowConfetti(false)} />
```

---

### Theming

The SDK uses CSS custom properties for all visual styling. There are three ways to customize the theme, applied in this order (highest precedence last):

**1. Dashboard appearance config** — set once in your Gamiforge dashboard; automatically applied via `<GamiforgeProvider>`.

**2. Theme prop on `<GamiforgeProvider>`** — overrides the dashboard config at the component level:

```tsx
<GamiforgeProvider
  config={...}
  userId={userId}
  theme={{
    colors: {
      primary: '#6C5CE7',
      primaryLight: '#a29bfe',
      success: '#00b894',
      warning: '#fdcb6e',
      danger: '#d63031',
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#2d3436',
      textSecondary: '#636e72',
      border: '#dfe6e9',
    },
    fontFamily: "'Inter', sans-serif",
    borderRadius: '12px',
    shadow: '0 4px 20px rgba(0,0,0,0.08)',
  }}
>
```

**3. CSS custom properties** — override directly in your stylesheet for full control:

```css
[data-gamiforge-theme] {
  --gf-color-primary: #6C5CE7;
  --gf-color-primary-light: #a29bfe;
  --gf-color-success: #00b894;
  --gf-color-warning: #fdcb6e;
  --gf-color-danger: #d63031;
  --gf-color-background: #ffffff;
  --gf-color-surface: #f8f9fa;
  --gf-color-text: #2d3436;
  --gf-color-text-secondary: #636e72;
  --gf-color-border: #dfe6e9;
  --gf-font-family: 'Inter', sans-serif;
  --gf-font-size-sm: 0.75rem;
  --gf-font-size-base: 0.875rem;
  --gf-font-size-lg: 1rem;
  --gf-font-size-xl: 1.25rem;
  --gf-border-radius: 12px;
  --gf-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --gf-transition-duration: 200ms;
  --gf-animation-duration: 400ms;
}
```

---

## Node.js / Server-Side Usage

Use `GamiforgeClient` directly when tracking events from a backend service (API route, webhook handler, background job, etc.).

```ts
import { GamiforgeClient } from '@gamiforge/sdk';

const client = new GamiforgeClient({
  runtimeBaseUrl: process.env.GAMIFORGE_RUNTIME_URL!,
  apiKey: process.env.GAMIFORGE_API_KEY!,
});

// Track an event
const result = await client.trackEvent({
  eventName: 'purchase.completed',
  userId: 'user_abc123',
  timestamp: new Date().toISOString(), // Optional — defaults to now
  metadata: { amount: 49.99, productId: 'pro_plan' },
});

// Fetch user state
const state = await client.getUserState('user_abc123');

// Fetch leaderboard
const leaderboard = await client.getLeaderboard({
  type: 'xp',
  limit: 10,
  windowDays: 7, // Rolling 7-day window
});

// Clean up when done (e.g., in a Lambda handler)
client.destroy();
```

---

## Error Handling

The SDK exports a typed error hierarchy. Catch errors by class to handle them appropriately.

```ts
import {
  GamiforgeError,
  ApiError,
  NetworkError,
  TimeoutError,
  ConfigError,
} from '@gamiforge/sdk';

try {
  await client.trackEvent({ eventName: 'test', userId: 'u1' });
} catch (err) {
  if (err instanceof ApiError) {
    console.error(`API error ${err.statusCode}:`, err.code, err.message);
    // err.responseBody contains the full error response body
  } else if (err instanceof NetworkError) {
    console.error('Network error:', err.message, err.cause);
  } else if (err instanceof TimeoutError) {
    console.error(`Request timed out after ${err.timeoutMs}ms`);
  } else if (err instanceof ConfigError) {
    console.error('Bad SDK config:', err.message);
  } else {
    throw err;
  }
}
```

**Quota exceeded** is handled gracefully — the SDK emits a `quotaExceeded` event instead of throwing, and `trackEvent` returns an empty awards list so your UI doesn't crash:

```ts
client.events.on('quotaExceeded', ({ message, limit, resetDate }) => {
  console.warn(`Event quota exceeded (limit: ${limit}). Resets: ${resetDate}`);
});
```

---

## TypeScript

The SDK is written in TypeScript and ships full type definitions. All public types are exported from the package roots.

```ts
import type {
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
} from '@gamiforge/sdk';

import type {
  GamiforgeProviderProps,
  GamiforgeTheme,
  GamiforgeThemeColors,
} from '@gamiforge/sdk/react';
```

---

## License

MIT © Gamiforge
