import React from 'react';
import { useUserState } from '../hooks/useUserState.js';
import { useXPProgress } from '../hooks/useXPProgress.js';
import { ProgressBar } from './ProgressBar.js';
import { StreakIndicator } from './StreakIndicator.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface UserProgressWidgetProps {
  /** Show streak indicator (default: true) */
  showStreak?: boolean;
  /** Show achievements count (default: true) */
  showAchievements?: boolean;
  /** Show XP progress bar (default: true) */
  showProgressBar?: boolean;
  /** Which streak to display */
  streakKey?: string;
  /** Widget title (default: "Your Progress") */
  title?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserProgressWidget({
  showStreak = true,
  showAchievements = true,
  showProgressBar = true,
  streakKey,
  title = 'Your Progress',
  className,
  style,
}: UserProgressWidgetProps) {
  const { achievements, loading } = useUserState();
  const { xp, level } = useXPProgress();

  if (loading) {
    return (
      <div className={`gf-user-progress gf-user-progress--loading ${className ?? ''}`} style={style}>
        <div className="gf-user-progress__title">{title}</div>
        <div className="gf-user-progress__skeleton" aria-label="Loading user progress" />
      </div>
    );
  }

  return (
    <div className={`gf-user-progress ${className ?? ''}`} style={style}>
      <div className="gf-user-progress__title">{title}</div>

      <div className="gf-user-progress__stats">
        <div className="gf-user-progress__stat">
          <span className="gf-user-progress__stat-value">{level}</span>
          <span className="gf-user-progress__stat-label">Level</span>
        </div>
        <div className="gf-user-progress__stat">
          <span className="gf-user-progress__stat-value">{xp.toLocaleString()}</span>
          <span className="gf-user-progress__stat-label">XP</span>
        </div>
        {showAchievements && (
          <div className="gf-user-progress__stat">
            <span className="gf-user-progress__stat-value">{achievements.length}</span>
            <span className="gf-user-progress__stat-label">Achievements</span>
          </div>
        )}
      </div>

      {showProgressBar && (
        <div className="gf-user-progress__bar">
          <ProgressBar showLabel={false} height={6} animated />
        </div>
      )}

      {showStreak && (
        <div className="gf-user-progress__streak">
          <StreakIndicator streakKey={streakKey} showLongest showIcon />
        </div>
      )}
    </div>
  );
}
