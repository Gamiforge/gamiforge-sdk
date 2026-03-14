/**
 * Gamiforge SDK — Next.js Client Component Example
 *
 * A "use client" component that wraps Gamiforge UI in a Next.js app.
 */

'use client';

import React from 'react';
import {
  GamiforgeProvider,
  AchievementToast,
  XPGainIndicator,
  LevelUpModal,
  UserProgressWidget,
} from '@gamiforge/sdk/react';

// Import styles in your root layout.tsx instead:
// import '@gamiforge/sdk/styles.css';

interface GamificationWrapperProps {
  userId: string;
  children: React.ReactNode;
}

export function GamificationWrapper({ userId, children }: GamificationWrapperProps) {
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

export function UserProgress() {
  return <UserProgressWidget title="Your Progress" />;
}
