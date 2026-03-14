import React, { useEffect, useState, useCallback, useContext } from 'react';
import { GamiforgeContext } from '../context.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LevelUpModalProps {
  /** Custom title (default: "Level Up!") */
  title?: string;
  /** Auto-dismiss after ms (default: 0 = manual dismiss only) */
  autoDismissMs?: number;
  /** Callback when modal is dismissed */
  onDismiss?: (level: number) => void;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LevelUpModal({
  title = 'Level Up!',
  autoDismissMs = 0,
  onDismiss,
  className,
  style,
}: LevelUpModalProps) {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'LevelUpModal must be used inside a <GamiforgeProvider>.'
    );
  }

  const [levelUp, setLevelUp] = useState<{ newLevel: number } | null>(null);

  // Subscribe to level-up events
  useEffect(() => {
    const unsubscribe = ctx.client.events.on('levelUp', (payload) => {
      setLevelUp({ newLevel: payload.newLevel });
    });

    return unsubscribe;
  }, [ctx.client]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!levelUp || autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelUp, autoDismissMs]);

  const handleDismiss = useCallback(() => {
    const level = levelUp?.newLevel ?? 0;
    setLevelUp(null);
    onDismiss?.(level);
  }, [levelUp, onDismiss]);

  if (!levelUp) return null;

  return (
    <div className={`gf-level-up-overlay ${className ?? ''}`} style={style}>
      <div
        className="gf-level-up-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — Level ${levelUp.newLevel}`}
      >
        <div className="gf-level-up-modal__icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 4L28.944 16.18L42 17.82L32.4 26.82L34.944 39.82L24 33.82L13.056 39.82L15.6 26.82L6 17.82L19.056 16.18L24 4Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="gf-level-up-modal__title">{title}</h2>
        <div className="gf-level-up-modal__level">Level {levelUp.newLevel}</div>
        <button
          className="gf-level-up-modal__button"
          onClick={handleDismiss}
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
