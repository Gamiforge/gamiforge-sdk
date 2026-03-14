import React from 'react';
import { useUserState } from '../hooks/useUserState.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StreakIndicatorProps {
  /** Which streak to display (default: first available streak) */
  streakKey?: string;
  /** Show longest streak alongside current (default: false) */
  showLongest?: boolean;
  /** Show the flame icon (default: true) */
  showIcon?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StreakIndicator({
  streakKey,
  showLongest = false,
  showIcon = true,
  className,
  style,
}: StreakIndicatorProps) {
  const { streaks, loading } = useUserState();

  if (loading) {
    return (
      <div className={`gf-streak gf-streak--loading ${className ?? ''}`} style={style}>
        <span className="gf-streak__placeholder" aria-hidden="true">--</span>
      </div>
    );
  }

  // Resolve which streak to show
  const keys = Object.keys(streaks);
  const resolvedKey = streakKey ?? keys[0];
  const streak = resolvedKey ? streaks[resolvedKey] : undefined;

  if (!streak) {
    return (
      <div className={`gf-streak gf-streak--empty ${className ?? ''}`} style={style}>
        <span className="gf-streak__count">0</span>
      </div>
    );
  }

  const isActive = streak.currentCount > 0;

  return (
    <div
      className={`gf-streak ${isActive ? 'gf-streak--active' : ''} ${className ?? ''}`}
      style={style}
      role="status"
      aria-label={`Current streak: ${streak.currentCount} days`}
    >
      {showIcon && (
        <span className="gf-streak__icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C10.97 6.29 7 8.58 7 12.5C7 15.54 9.46 18 12.5 18C13.58 18 14.58 17.67 15.42 17.11C14.38 16.5 13.67 15.37 13.67 14.08C13.67 12.16 15.5 10.83 16 8C17.58 10.58 18 12.42 18 14.08C18 16.25 16.42 18 14.5 18C16.54 18 18.5 16.04 18.5 13.5C18.5 9.1 14 5.5 12 2Z"
              fill="currentColor"
            />
          </svg>
        </span>
      )}
      <span className="gf-streak__count">{streak.currentCount}</span>
      <span className="gf-streak__label">day streak</span>
      {showLongest && (
        <span className="gf-streak__longest">
          Best: {streak.longestCount}
        </span>
      )}
    </div>
  );
}
