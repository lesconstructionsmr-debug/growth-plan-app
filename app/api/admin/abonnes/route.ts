import { NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET /api/admin/abonnes — liste tous les abonnements (admin plateforme uniquement)
export async function GET() {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('subscriptions')
      .select(`
        id, stripe_customer_id, stripe_subscription_id,
        status, plan, trial_end, current_period_end, created_at,
        companies(name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const abonnes = (data ?? []).map(s => {
      const co = s.companies as { name?: string; email?: string } | null
      const planRaw = s.plan ?? 'mensuel'
      const plan = planRaw === 'year' || planRaw === 'annuel' ? 'annuel' : 'mensuel'
      return {
        id: s.id,
        nom: co?.name ?? s.stripe_customer_id ?? '—',
        email: co?.email ?? '',
        plan,
        statut: s.status ?? 'active',
        debut: s.trial_end
          ? new Date(s.trial_end).toISOString().split('T')[0]
          : s.created_at
            ? new Date(s.created_at).toISOString().split('T')[0]
            : '',
        prochain_paiement: s.current_period_end
          ? new Date(s.current_period_end).toISOString().split('T')[0]
          : null,
        montant: plan === 'annuel' ? 2000 : 175,
        stripe_customer_id: s.stripe_customer_id ?? '',
      }
    })

    return NextResponse.json(abonnes)
  } catch (err) {
    return apiError(err, '[GET /api/admin/abonnes]')
  }
}
