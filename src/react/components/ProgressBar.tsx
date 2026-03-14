import React from 'react';
import { useXPProgress } from '../hooks/useXPProgress.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProgressBarProps {
  /** Show "Level N — X/Y XP" label above the bar (default: true) */
  showLabel?: boolean;
  /** Show percentage text inside the bar (default: false) */
  showPercentage?: boolean;
  /** Animate the fill on change (default: true) */
  animated?: boolean;
  /** Bar height in pixels (default: 8) */
  height?: number;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProgressBar({
  showLabel = true,
  showPercentage = false,
  animated = true,
  height = 8,
  className,
  style,
}: ProgressBarProps) {
  const { xp, level, xpForNextLevel, progress, isMaxLevel } = useXPProgress();

  const percentage = Math.round(progress * 100);

  return (
    <div
      className={`gf-progress-bar ${className ?? ''}`}
      style={style}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Level ${level} progress: ${percentage}%`}
    >
      {showLabel && (
        <div className="gf-progress-bar__label">
          <span className="gf-progress-bar__level">Level {level}</span>
          <span className="gf-progress-bar__xp">
            {isMaxLevel
              ? `${xp.toLocaleString()} XP (Max)`
              : `${xp.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP`}
          </span>
        </div>
      )}
      <div className="gf-progress-bar__track" style={{ height }}>
        <div
          className={`gf-progress-bar__fill ${animated ? 'gf-progress-bar__fill--animated' : ''}`}
          style={{ width: `${percentage}%` }}
        >
          {showPercentage && (
            <span className="gf-progress-bar__percentage">{percentage}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
