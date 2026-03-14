/**
 * Gamiforge SDK — Next.js API Route Example
 *
 * Server-side event tracking from a Next.js API route.
 * This pattern is useful when you want to validate events on your server
 * before forwarding them to Gamiforge.
 */

import { GamiforgeClient } from '@gamiforge/sdk';
import { NextRequest, NextResponse } from 'next/server';

// Create a single client instance (reused across requests)
const gamiforge = new GamiforgeClient({
  runtimeBaseUrl: process.env.GAMIFORGE_RUNTIME_URL!,
  apiKey: process.env.GAMIFORGE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Your own validation logic
    const { eventName, userId, metadata } = body;

    if (!eventName || !userId) {
      return NextResponse.json(
        { error: 'eventName and userId are required' },
        { status: 400 }
      );
    }

    // Forward to Gamiforge Runtime
    const result = await gamiforge.trackEvent({
      eventName,
      userId,
      metadata,
    });

    return NextResponse.json({
      awards: result.awards,
      state: result.currentState,
    });
  } catch (error) {
    console.error('Gamiforge tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
