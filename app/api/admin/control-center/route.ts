import { NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/** input none / output snapshot centre de contrôle / rôle fondateur */
export async function GET() {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()

    const [tasksRes, leadsRes, subsRes] = await Promise.all([
      admin.from('platform_tasks').select('id, statut, priorite, due_date'),
      admin.from('platform_leads').select('id, statut, score'),
      admin.from('subscriptions').select('id, status, plan'),
    ])

    if (tasksRes.error && !String(tasksRes.error.message).includes('does not exist')) throw tasksRes.error
    if (leadsRes.error && !String(leadsRes.error.message).includes('does not exist')) throw leadsRes.error

    const tasks = tasksRes.data ?? []
    const leads = leadsRes.data ?? []
    const subs = subsRes.data ?? []

    const today = new Date().toISOString().slice(0, 10)
    const tachesOuvertes = tasks.filter(t => t.statut === 'a_faire' || t.statut === 'en_cours')
    const tachesUrgentes = tachesOuvertes.filter(t => t.priorite === 'urgente' || t.priorite === 'haute')
    const tachesEnRetard = tachesOuvertes.filter(t => t.due_date && t.due_date < today)

    const leadsActifs = leads.filter(l => !['client', 'perdu'].includes(l.statut))
    const leadsChauds = leads.filter(l => (l.score ?? 0) >= 70 && !['client', 'perdu'].includes(l.statut))
    const essais = subs.filter(s => s.status === 'trialing').length
    const actifs = subs.filter(s => s.status === 'active').length

    return NextResponse.json({
      tachesOuvertes: tachesOuvertes.length,
      tachesUrgentes: tachesUrgentes.length,
      tachesEnRetard: tachesEnRetard.length,
      leadsActifs: leadsActifs.length,
      leadsChauds: leadsChauds.length,
      essais,
      abonnesActifs: actifs,
      migrationRequise: Boolean(tasksRes.error || leadsRes.error),
    })
  } catch (err) {
    return apiError(err, '[GET /api/admin/control-center]')
  }
}
