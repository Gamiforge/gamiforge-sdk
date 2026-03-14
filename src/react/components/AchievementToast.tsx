import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  useAchievementFeed,
  type AchievementFeedItem,
  type AchievementImportance,
} from '../hooks/useAchievementFeed.js';
import { ConfettiBurst } from './Confetti.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AchievementToastProps {
  /** Position on screen (default: "top-right") */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Auto-dismiss duration in ms (default: 5000). Set 0 to disable. */
  duration?: number;
  /** Maximum visible toasts at once (default: 5) */
  maxVisible?: number;
  /**
   * Explicit importance overrides per achievement key.
   * Keys not in this map fall back to pattern-based inference.
   */
  importanceMap?: Record<string, AchievementImportance>;
  /** Disable confetti effect for important/legendary achievements (default: false) */
  disableConfetti?: boolean;
  /** Callback when a toast is dismissed */
  onDismiss?: (achievementKey: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AchievementToast({
  position = 'top-right',
  duration = 5000,
  maxVisible = 5,
  importanceMap,
  disableConfetti = false,
  onDismiss,
  className,
  style,
}: AchievementToastProps) {
  const { achievements, dismiss } = useAchievementFeed(importanceMap);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Track confetti triggers
  const [confettiTrigger, setConfettiTrigger] = useState<{
    key: string;
    level: 'important' | 'legendary';
  } | null>(null);

  const handleDismiss = useCallback(
    (key: string) => {
      const timer = timersRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(key);
      }
      dismiss(key);
      onDismiss?.(key);
    },
    [dismiss, onDismiss]
  );

  // Auto-dismiss timers — important/legendary toasts get extra time
  useEffect(() => {
    if (duration <= 0) return;

    for (const item of achievements) {
      if (!timersRef.current.has(item.achievementKey)) {
        const multiplier =
          item.importance === 'legendary' ? 2.0 :
          item.importance === 'important' ? 1.5 : 1.0;
        const timer = setTimeout(() => {
          handleDismiss(item.achievementKey);
        }, duration * multiplier);
        timersRef.current.set(item.achievementKey, timer);
      }
    }
  }, [achievements, duration, handleDismiss]);

  // Fire confetti for important/legendary achievements
  useEffect(() => {
    if (disableConfetti) return;

    for (const item of achievements) {
      if (item.importance === 'important' || item.importance === 'legendary') {
        setConfettiTrigger({
          key: `${item.achievementKey}-${item.timestamp}`,
          level: item.importance,
        });
        break; // only one burst at a time
      }
    }
  }, [achievements, disableConfetti]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  const visible = achievements.slice(0, maxVisible);

  if (visible.length === 0 && !confettiTrigger) return null;

  // Determine stacking direction based on position
  const isBottom = position.startsWith('bottom');

  return (
    <>
      {/* Confetti overlay */}
      {confettiTrigger && (
        <ConfettiBurst
          triggerKey={confettiTrigger.key}
          level={confettiTrigger.level}
        />
      )}

      {/* Toast stack */}
      <div
        className={`gf-achievement-toast gf-achievement-toast--${position} ${className ?? ''}`}
        style={style}
        aria-live="polite"
        aria-label="Achievement notifications"
      >
        {visible.map((item, index) => (
          <AchievementToastItem
            key={item.achievementKey}
            item={item}
            index={index}
            total={visible.length}
            isBottom={isBottom}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Individual Toast Item — with stacking offset & importance styling
// ---------------------------------------------------------------------------

function AchievementToastItem({
  item,
  index,
  total,
  isBottom,
  onDismiss,
}: {
  item: AchievementFeedItem;
  index: number;
  total: number;
  isBottom: boolean;
  onDismiss: (key: string) => void;
}) {
  const importanceClass =
    item.importance !== 'normal'
      ? ` gf-achievement-toast__item--${item.importance}`
      : '';

  // Stacking: newest (index 0) is on top; older toasts shift down/up and
  // get progressively smaller + more transparent
  const stackOffset = index * 8;
  const stackScale = 1 - index * 0.03;
  const stackOpacity = 1 - index * 0.12;
  const translateDir = isBottom ? -stackOffset : stackOffset;

  return (
    <div
      className={`gf-achievement-toast__item${importanceClass}`}
      role="status"
      style={{
        transform: `translateY(${translateDir}px) scale(${stackScale})`,
        opacity: Math.max(stackOpacity, 0.4),
        zIndex: total - index,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Importance shimmer overlay for legendary */}
      {item.importance === 'legendary' && (
        <div className="gf-achievement-toast__shimmer" aria-hidden="true" />
      )}

      <div className="gf-achievement-toast__icon" aria-hidden="true">
        {item.importance === 'legendary' ? (
          /* Trophy icon for legendary */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M7 4V2H17V4H20C20.55 4 21 4.45 21 5V8C21 9.66 19.66 11 18 11H17.23C16.5 13.13 14.72 14.75 12.5 15.15V18H16V20H8V18H11.5V15.15C9.28 14.75 7.5 13.13 6.77 11H6C4.34 11 3 9.66 3 8V5C3 4.45 3.45 4 4 4H7ZM7 6H5V8C5 8.55 5.45 9 6 9H7V6ZM17 6V9H18C18.55 9 19 8.55 19 8V6H17ZM9 4V10C9 11.66 10.34 13 12 13C13.66 13 15 11.66 15 10V4H9Z"
              fill="currentColor"
            />
          </svg>
        ) : item.importance === 'important' ? (
          /* Diamond icon for important */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L2 12L12 22L22 12L12 2ZM12 4.83L19.17 12L12 19.17L4.83 12L12 4.83Z"
              fill="currentColor"
            />
            <path
              d="M12 7L7 12L12 17L17 12L12 7Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          /* Star icon for normal */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>
      <div className="gf-achievement-toast__content">
        <div className="gf-achievement-toast__title">
          {item.importance === 'legendary'
            ? 'Legendary Achievement!'
            : item.importance === 'important'
            ? 'Major Achievement!'
            : 'Achievement Unlocked!'}
        </div>
        <div className="gf-achievement-toast__name">{item.achievementKey}</div>
      </div>
      <button
        className="gf-achievement-toast__close"
        onClick={() => onDismiss(item.achievementKey)}
        aria-label="Dismiss achievement notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
