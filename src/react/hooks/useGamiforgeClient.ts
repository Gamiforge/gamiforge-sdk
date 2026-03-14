import { useContext } from 'react';
import { GamiforgeContext } from '../context.js';
import type { GamiforgeClient } from '../../client/index.js';

/**
 * Access the underlying GamiforgeClient instance from context.
 *
 * Must be used inside a `<GamiforgeProvider>`.
 */
export function useGamiforgeClient(): GamiforgeClient {
  const ctx = useContext(GamiforgeContext);
  if (!ctx) {
    throw new Error(
      'useGamiforgeClient must be used inside a <GamiforgeProvider>. ' +
        'Wrap your component tree with <GamiforgeProvider config={...} userId="...">.'
    );
  }
  return ctx.client;
}
