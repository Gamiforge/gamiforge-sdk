import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { GamiforgeContext } from '../context.js';
import { useAwardFeed, type AwardFeedItem } from '../hooks/useAwardFeed.js';
import type { AchievementImportance } from '../hooks/useAchievementFeed.js';
import { ConfettiBurst } from './Confetti.js';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AwardToastProps {
  /**
   * Position on screen. If omitted, uses the tenant's appearance config
   * from the GamiforgeProvider context (default fallback: "top-right").
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Auto-dismiss duration in ms (default: 5000). Set 0 to disable. */
  duration?: number;
  /** Maximum visible toasts at once (default: 6) */
  maxVisible?: number;
  /**
   * Explicit importance overrides per achievement key.
   * Keys not in this map fall back to pattern-based inference.
   */
  importanceMap?: Record<string, AchievementImportance>;
  /** Disable confetti effect for important/legendary awards (default: false) */
  disableConfetti?: boolean;
  /** Callback when a toast is dismissed */
  onDismiss?: (id: string) => void;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Icons as inline SVGs
// ---------------------------------------------------------------------------

function XpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4L12 20M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 12L12 22L22 12L12 2ZM12 4.83L19.17 12L12 19.17L4.83 12L12 4.83Z" fill="currentColor" />
      <path d="M12 7L7 12L12 17L17 12L12 7Z" fill="currentColor" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4V2H17V4H20C20.55 4 21 4.45 21 5V8C21 9.66 19.66 11 18 11H17.23C16.5 13.13 14.72 14.75 12.5 15.15V18H16V20H8V18H11.5V15.15C9.28 14.75 7.5 13.13 6.77 11H6C4.34 11 3 9.66 3 8V5C3 4.45 3.45 4 4 4H7ZM7 6H5V8C5 8.55 5.45 9 6 9H7V6ZM17 6V9H18C18.55 9 19 8.55 19 8V6H17ZM9 4V10C9 11.66 10.34 13 12 13C13.66 13 15 11.66 15 10V4H9Z" fill="currentColor" />
    </svg>
  );
}

function LevelUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 23C16.5 23 20 19.5 20 15C20 11 17 8.5 14.5 6.5C14 6.1 13 5.3 12.5 4C12 5 11 6.5 10.5 7C8 9.5 4 12 4 15C4 19.5 7.5 23 12 23ZM12.5 19C11 19 10 18 10 16.5C10 15.5 10.5 14.5 12 13C13.5 14.5 14 15.5 14 16.5C14 18 13 19 12.5 19Z" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AwardToast({
  position: positionProp,
  duration = 5000,
  maxVisible = 6,
  importanceMap,
  disableConfetti = false,
  onDismiss,
  className,
  style,
}: AwardToastProps) {
  // Use explicit prop > tenant appearance config > default 'top-right'
  const ctx = useContext(GamiforgeContext);
  const position = positionProp ?? ctx?.toastPosition ?? 'top-right';
  const achievementImages = ctx?.achievementImages ?? {};

  const { awards, dismiss } = useAwardFeed(importanceMap);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Track confetti triggers
  const [confettiTrigger, setConfettiTrigger] = useState<{
    key: string;
    level: 'important' | 'legendary';
  } | null>(null);

  const handleDismiss = useCallback(
    (id: string) => {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
      dismiss(id);
      onDismiss?.(id);
    },
    [dismiss, onDismiss]
  );

  // Auto-dismiss timers — importance-based multipliers
  useEffect(() => {
    if (duration <= 0) return;

    for (const item of awards) {
      if (!timersRef.current.has(item.id)) {
        const multiplier =
          item.importance === 'legendary' ? 2.0 :
          item.importance === 'important' ? 1.5 : 1.0;
        const timer = setTimeout(() => {
          handleDismiss(item.id);
        }, duration * multiplier);
        timersRef.current.set(item.id, timer);
      }
    }
  }, [awards, duration, handleDismiss]);

  // Fire confetti for important/legendary awards
  useEffect(() => {
    if (disableConfetti) return;

    for (const item of awards) {
      if (item.importance === 'important' || item.importance === 'legendary') {
        setConfettiTrigger({
          key: `${item.id}-${item.timestamp}`,
          level: item.importance,
        });
        break;
      }
    }
  }, [awards, disableConfetti]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  const visible = awards.slice(0, maxVisible);

  if (visible.length === 0 && !confettiTrigger) return null;

  const isBottom = position.startsWith('bottom');

  return (
    <>
      {confettiTrigger && (
        <ConfettiBurst
          triggerKey={confettiTrigger.key}
          level={confettiTrigger.level}
        />
      )}

      <div
        className={`gf-award-toast gf-award-toast--${position} ${className ?? ''}`}
        style={style}
        aria-live="polite"
        aria-label="Award notifications"
      >
        {visible.map((item, index) => (
          <AwardToastItem
            key={item.id}
            item={item}
            index={index}
            total={visible.length}
            isBottom={isBottom}
            onDismiss={handleDismiss}
            customImageUrl={
              item.type === 'achievement' && item.achievementKey
                ? achievementImages[item.achievementKey]
                : undefined
            }
          />
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Individual Award Toast Item
// ---------------------------------------------------------------------------

function getAwardIcon(item: AwardFeedItem) {
  switch (item.type) {
    case 'xp':
      return <XpIcon />;
    case 'streak_increment':
      return <FlameIcon />;
    case 'level_up':
      return <LevelUpIcon />;
    case 'achievement':
      if (item.importance === 'legendary') return <TrophyIcon />;
      if (item.importance === 'important') return <DiamondIcon />;
      return <StarIcon />;
    default:
      return <StarIcon />;
  }
}

function getAwardLabel(item: AwardFeedItem): { title: string; detail: string } {
  switch (item.type) {
    case 'xp':
      return { title: 'XP Earned', detail: `+${item.amount ?? 0} XP` };
    case 'streak_increment':
      return { title: 'Streak', detail: `${item.streakKey ?? 'streak'} +1` };
    case 'level_up':
      return { title: 'Level Up!', detail: `Level ${item.amount ?? '?'}` };
    case 'achievement':
      if (item.importance === 'legendary') return { title: 'Legendary Achievement!', detail: item.achievementKey ?? '' };
      if (item.importance === 'important') return { title: 'Major Achievement!', detail: item.achievementKey ?? '' };
      return { title: 'Achievement Unlocked!', detail: item.achievementKey ?? '' };
    default:
      return { title: 'Award', detail: item.reason };
  }
}

function AwardToastItem({
  item,
  index,
  total,
  isBottom,
  onDismiss,
  customImageUrl,
}: {
  item: AwardFeedItem;
  index: number;
  total: number;
  isBottom: boolean;
  onDismiss: (id: string) => void;
  customImageUrl?: string;
}) {
  const typeClass = `gf-award-toast__item--${item.type.replace('_', '-')}`;
  const importanceClass =
    item.importance !== 'normal'
      ? ` gf-award-toast__item--${item.importance}`
      : '';

  // Stacking offsets
  const stackOffset = index * 8;
  const stackScale = 1 - index * 0.03;
  const stackOpacity = 1 - index * 0.12;
  const translateDir = isBottom ? -stackOffset : stackOffset;

  const { title, detail } = getAwardLabel(item);

  return (
    <div
      className={`gf-award-toast__item ${typeClass}${importanceClass}`}
      role="status"
      style={{
        transform: `translateY(${translateDir}px) scale(${stackScale})`,
        opacity: Math.max(stackOpacity, 0.4),
        zIndex: total - index,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {item.importance === 'legendary' && (
        <div className="gf-award-toast__shimmer" aria-hidden="true" />
      )}

      <div className="gf-award-toast__icon" aria-hidden="true">
        {customImageUrl ? (
          <img
            src={customImageUrl}
            alt=""
            className="gf-award-toast__custom-img"
          />
        ) : (
          getAwardIcon(item)
        )}
      </div>
      <div className="gf-award-toast__content">
        <div className="gf-award-toast__title">{title}</div>
        <div className="gf-award-toast__detail">{detail}</div>
      </div>
      <button
        className="gf-award-toast__close"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
