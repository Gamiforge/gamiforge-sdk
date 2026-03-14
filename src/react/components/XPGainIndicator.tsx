import React, { useEffect, useState, useRef } from 'react';
import { useContext } from 'react';
import { GamiforgeContext } from '../context.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface XPGainItem {
  id: string;
  amount: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface XPGainIndicatorProps {
  /** Position on screen (default: "top-right") */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  /** How long each indicator stays visible in ms (default: 2000) */
  duration?: number;
  /** Maximum simultaneous indicators (default: 5) */
  maxVisible?: number;
  /** Additional CSS class */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function XPGainIndicator({
  position = 'top-right',
  duration = 2000,
  maxVisible = 5,
  className,
  style,
}: XPGainIndicatorProps) {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'XPGainIndicator must be used inside a <GamiforgeProvider>.'
    );
  }

  const [items, setItems] = useState<XPGainItem[]>([]);
  const counterRef = useRef(0);

  // Subscribe to XP events
  useEffect(() => {
    const unsubscribe = ctx.client.events.on('xp', (payload) => {
      if (payload.amount <= 0) return;

      const id = `xp-${++counterRef.current}`;
      const item: XPGainItem = {
        id,
        amount: payload.amount,
        timestamp: Date.now(),
      };

      setItems((prev) => [item, ...prev].slice(0, maxVisible));

      // Auto-remove after duration
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, duration);
    });

    return unsubscribe;
  }, [ctx.client, duration, maxVisible]);

  if (items.length === 0) return null;

  return (
    <div
      className={`gf-xp-gain gf-xp-gain--${position} ${className ?? ''}`}
      style={style}
      aria-live="polite"
      aria-label="XP gain notifications"
    >
      {items.map((item) => (
        <div key={item.id} className="gf-xp-gain__item" role="status">
          +{item.amount} XP
        </div>
      ))}
    </div>
  );
}
