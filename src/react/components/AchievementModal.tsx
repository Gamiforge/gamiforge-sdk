import React, { useEffect, useState, useCallback, useContext } from 'react';
import { GamiforgeContext } from '../context.js';

// ---------------------------------------------------------------------------
// Per-achievement modal configuration
// ---------------------------------------------------------------------------

export interface AchievementModalConfig {
  /** Modal heading. Falls back to the achievement key if omitted. */
  title?: string;
  /** Optional body text shown below the title. */
  description?: string;
  /** Dismiss button label. Defaults to "Awesome!" */
  buttonText?: string;
  /** Custom image URL or base64 data URI for the achievement icon. */
  imageUrl?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AchievementModalProps {
  /**
   * Per-achievement display config, keyed by achievement key.
   * Only achievements present in this map will be shown as modals.
   * If omitted, ALL achievement events will trigger a modal.
   */
  achievementConfig?: Record<string, AchievementModalConfig>;
  /** Backdrop style. Defaults to "darken". */
  backdropStyle?: 'blur' | 'darken';
  /** Auto-dismiss after ms (default: 0 = manual dismiss only). */
  autoDismissMs?: number;
  /** Callback when the modal is dismissed. */
  onDismiss?: (achievementKey: string) => void;
  /** Additional CSS class on the overlay. */
  className?: string;
  /** Inline style overrides on the overlay. */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActiveModal {
  achievementKey: string;
  config: AchievementModalConfig;
}

export function AchievementModal({
  achievementConfig,
  backdropStyle = 'darken',
  autoDismissMs = 0,
  onDismiss,
  className,
  style,
}: AchievementModalProps) {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'AchievementModal must be used inside a <GamiforgeProvider>.'
    );
  }

  const [queue, setQueue] = useState<ActiveModal[]>([]);

  // Subscribe to achievement events
  useEffect(() => {
    const unsubscribe = ctx.client.events.on('achievement', (payload) => {
      const key = payload.achievementKey;

      // If a config map is provided, only show modals for mapped achievements
      if (achievementConfig && !(key in achievementConfig)) return;

      const config: AchievementModalConfig = achievementConfig?.[key] ?? {};

      setQueue((prev) => {
        // Deduplicate — don't stack the same key twice
        if (prev.some((m) => m.achievementKey === key)) return prev;
        return [...prev, { achievementKey: key, config }];
      });
    });

    return unsubscribe;
  }, [ctx.client, achievementConfig]);

  const handleDismiss = useCallback(() => {
    setQueue((prev) => {
      const [current, ...rest] = prev;
      if (current) onDismiss?.(current.achievementKey);
      return rest;
    });
  }, [onDismiss]);

  // Auto-dismiss timer for the current (front) modal
  useEffect(() => {
    if (!queue.length || autoDismissMs <= 0) return;
    const timer = setTimeout(handleDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [queue, autoDismissMs, handleDismiss]);

  const current = queue[0];
  if (!current) return null;

  const backdropClass =
    backdropStyle === 'blur'
      ? 'gf-achievement-modal-overlay gf-achievement-modal-overlay--blur'
      : 'gf-achievement-modal-overlay gf-achievement-modal-overlay--darken';

  const { config } = current;
  const title = config.title || current.achievementKey;
  const buttonText = config.buttonText || 'Awesome!';

  return (
    <div
      className={`${backdropClass} ${className ?? ''}`}
      style={style}
      onClick={handleDismiss}
      role="presentation"
    >
      <div
        className="gf-achievement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gf-achievement-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="gf-achievement-modal__icon" aria-hidden="true">
          {config.imageUrl ? (
            <img
              src={config.imageUrl}
              alt={title}
              className="gf-achievement-modal__image"
            />
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7 4V2H17V4H20C20.55 4 21 4.45 21 5V8C21 9.66 19.66 11 18 11H17.23C16.5 13.13 14.72 14.75 12.5 15.15V18H16V20H8V18H11.5V15.15C9.28 14.75 7.5 13.13 6.77 11H6C4.34 11 3 9.66 3 8V5C3 4.45 3.45 4 4 4H7ZM7 6H5V8C5 8.55 5.45 9 6 9H7V6ZM17 6V9H18C18.55 9 19 8.55 19 8V6H17ZM9 4V10C9 11.66 10.34 13 12 13C13.66 13 15 11.66 15 10V4H9Z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>

        {/* Badge */}
        <div className="gf-achievement-modal__badge" aria-hidden="true">
          Achievement Unlocked
        </div>

        {/* Title */}
        <h2
          id="gf-achievement-modal-title"
          className="gf-achievement-modal__title"
        >
          {title}
        </h2>

        {/* Description */}
        {config.description && (
          <p className="gf-achievement-modal__description">
            {config.description}
          </p>
        )}

        {/* Remaining in queue indicator */}
        {queue.length > 1 && (
          <p className="gf-achievement-modal__queue-hint" aria-live="polite">
            +{queue.length - 1} more achievement{queue.length - 1 !== 1 ? 's' : ''}
          </p>
        )}

        {/* Dismiss button */}
        <button
          className="gf-achievement-modal__button"
          onClick={handleDismiss}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
