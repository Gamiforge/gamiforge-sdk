# Next.js SaaS onboarding example

This example shows how to use Gamiforge in a Next.js app to reward onboarding milestones in a SaaS product.

## What it demonstrates

- hosted-first Gamiforge integration
- a client-side Gamiforge provider
- reward UI for achievements, XP, and level-ups
- a simple onboarding checklist
- server-side event tracking through a Next.js route

## Example onboarding milestones

- complete your profile
- invite a teammate
- connect an integration
- create your first project

Each action can trigger XP, achievements, streaks, or level progress.

## Environment variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_GAMIFORGE_RUNTIME_URL=https://your-runtime.gamiforge.io
NEXT_PUBLIC_GAMIFORGE_API_KEY=gf_your_public_or_client_key_here
GAMIFORGE_RUNTIME_URL=https://your-runtime.gamiforge.io
GAMIFORGE_API_KEY=gf_your_server_key_here
```

## App structure

- `components/Gamification.tsx` wraps the app with `GamiforgeProvider`
- `app/page.tsx` renders a lightweight SaaS onboarding dashboard
- `app/api/track/route.ts` forwards onboarding events to Gamiforge on the server

## First reward flow

1. Open the onboarding dashboard
2. Click one of the onboarding tasks
3. The app posts an event to `/api/track`
4. Gamiforge returns awards and updated state
5. Reward UI appears in the app

## Suggested events

- `profile.completed`
- `teammate.invited`
- `integration.connected`
- `project.created`

## Notes

This example is intentionally simple. The goal is to show the fastest path from SaaS onboarding actions to visible reward moments.
