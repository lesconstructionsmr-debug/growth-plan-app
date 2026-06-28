import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'
import SubscriptionBanner from '@/components/subscription-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let subStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'none' = 'none'
  let trialDaysLeft = 0

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) redirect('/login')

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single() as { data: { company_id: string } | null }

      if (profile?.company_id) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('status, trial_end')
          .eq('company_id', profile.company_id)
          .single() as { data: { status: string; trial_end: string | null } | null }

        if (sub) {
          subStatus = sub.status as typeof subStatus
          if (sub.status === 'trialing' && sub.trial_end) {
            const msLeft = new Date(sub.trial_end).getTime() - Date.now()
            trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
          }
        }
      }
    } catch {
      // Supabase non accessible — laisser passer (dev sans config)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg-0)' }}>
      <SubscriptionBanner status={subStatus} trialDaysLeft={trialDaysLeft} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-0)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}