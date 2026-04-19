import { GamificationWrapper, UserProgress } from '../components/Gamification';

const onboardingSteps = [
  {
    title: 'Complete your profile',
    description: 'Add your team name and finish the basic setup.',
    eventName: 'profile.completed',
    xp: '+40 XP',
  },
  {
    title: 'Invite a teammate',
    description: 'Bring someone else into the workspace.',
    eventName: 'teammate.invited',
    xp: '+60 XP',
  },
  {
    title: 'Connect an integration',
    description: 'Hook up Stripe, Slack, or GitHub.',
    eventName: 'integration.connected',
    xp: '+80 XP',
  },
  {
    title: 'Create your first project',
    description: 'Launch the first real workflow in the product.',
    eventName: 'project.created',
    xp: '+120 XP',
  },
];

async function trackOnboardingEvent(eventName: string) {
  await fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      userId: 'demo-saas-user',
      metadata: { source: 'nextjs-onboarding-example' },
    }),
  });
}

export default function Page() {
  return (
    <GamificationWrapper userId="demo-saas-user">
      <main
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '40px 24px',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: '#ede9fe', color: '#6d28d9', fontSize: 14, fontWeight: 600 }}>
                Next.js SaaS onboarding example
              </div>
              <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: '18px 0 12px', fontWeight: 800 }}>
                Reward onboarding milestones without building a custom progression backend
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.6, color: '#475569', margin: 0 }}>
                This example shows how a SaaS team could use Gamiforge to reward setup progress, integration steps,
                teammate invites, and first-project creation.
              </p>
            </div>
            <div style={{ minWidth: 280, flex: '1 1 320px' }}>
              <UserProgress />
            </div>
          </div>

          <section
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: 24,
            }}
          >
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Onboarding checklist</p>
                  <h2 style={{ margin: '8px 0 0', fontSize: 28 }}>Help the user reach activation</h2>
                </div>
                <div style={{ textAlign: 'right', color: '#64748b', fontSize: 14 }}>
                  Trigger one event per action
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                {onboardingSteps.map((step, index) => (
                  <div
                    key={step.eventName}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 20,
                      alignItems: 'center',
                      padding: 20,
                      borderRadius: 16,
                      border: '1px solid #e2e8f0',
                      background: index === 0 ? '#faf5ff' : '#fff',
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{step.title}</h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: 15 }}>{step.description}</p>
                    </div>
                    <button
                      onClick={() => trackOnboardingEvent(step.eventName)}
                      style={{
                        border: 'none',
                        borderRadius: 12,
                        padding: '12px 16px',
                        background: '#7c3aed',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        minWidth: 130,
                      }}
                    >
                      {step.xp}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <aside style={{ display: 'grid', gap: 20 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suggested reward logic</p>
                <ul style={{ margin: '14px 0 0', paddingLeft: 18, color: '#475569', lineHeight: 1.7 }}>
                  <li>XP for each onboarding step</li>
                  <li>An achievement for the first integration</li>
                  <li>A level-up near activation</li>
                  <li>A streak for repeated setup progress</li>
                </ul>
              </div>

              <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 20, padding: 24 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Why this example matters</p>
                <p style={{ margin: '12px 0 0', lineHeight: 1.7, color: '#cbd5e1' }}>
                  SaaS onboarding is one of the clearest early use cases for Gamiforge. It ties progression directly to activation and makes the value obvious fast.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </GamificationWrapper>
  );
}
