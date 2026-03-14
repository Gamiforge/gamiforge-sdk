import React from 'react';
import { useLeaderboard, type UseLeaderboardOptions } from '../hooks/useLeaderboard.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LeaderboardProps extends UseLeaderboardOptions {
  /** Highlight this user's row (pass the current user's external ID) */
  highlightUserId?: string;
  /** Show rank numbers (default: true) */
  showRank?: boolean;
  /** Table title (default: "Leaderboard") */
  title?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Leaderboard({
  type,
  streakKey,
  limit = 10,
  windowDays,
  pollInterval,
  highlightUserId,
  showRank = true,
  title = 'Leaderboard',
  className,
  style,
}: LeaderboardProps) {
  const { entries, loading, error } = useLeaderboard({
    type,
    streakKey,
    limit,
    windowDays,
    pollInterval,
  });

  if (loading && entries.length === 0) {
    return (
      <div className={`gf-leaderboard gf-leaderboard--loading ${className ?? ''}`} style={style}>
        <div className="gf-leaderboard__title">{title}</div>
        <div className="gf-leaderboard__skeleton" aria-label="Loading leaderboard">
          {Array.from({ length: Math.min(limit, 5) }, (_, i) => (
            <div key={i} className="gf-leaderboard__skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className={`gf-leaderboard gf-leaderboard--error ${className ?? ''}`} style={style}>
        <div className="gf-leaderboard__title">{title}</div>
        <div className="gf-leaderboard__error" role="alert">
          Unable to load leaderboard
        </div>
      </div>
    );
  }

  const valueLabel = type === 'xp' ? 'XP' : 'Streak';

  return (
    <div className={`gf-leaderboard ${className ?? ''}`} style={style}>
      <div className="gf-leaderboard__title">{title}</div>
      <table className="gf-leaderboard__table" role="table" aria-label={title}>
        <thead>
          <tr>
            {showRank && <th className="gf-leaderboard__th gf-leaderboard__th--rank">#</th>}
            <th className="gf-leaderboard__th gf-leaderboard__th--user">User</th>
            <th className="gf-leaderboard__th gf-leaderboard__th--value">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isHighlighted = highlightUserId === entry.userId;
            return (
              <tr
                key={entry.userId}
                className={`gf-leaderboard__row ${isHighlighted ? 'gf-leaderboard__row--highlighted' : ''}`}
              >
                {showRank && (
                  <td className="gf-leaderboard__td gf-leaderboard__td--rank">
                    {entry.rank <= 3 ? (
                      <span className={`gf-leaderboard__medal gf-leaderboard__medal--${entry.rank}`}>
                        {entry.rank === 1 ? '\uD83E\uDD47' : entry.rank === 2 ? '\uD83E\uDD48' : '\uD83E\uDD49'}
                      </span>
                    ) : (
                      entry.rank
                    )}
                  </td>
                )}
                <td className="gf-leaderboard__td gf-leaderboard__td--user">
                  {entry.userId}
                </td>
                <td className="gf-leaderboard__td gf-leaderboard__td--value">
                  {entry.value.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
