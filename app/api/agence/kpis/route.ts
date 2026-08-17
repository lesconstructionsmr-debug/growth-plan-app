import { NextResponse } from 'next/server'
import { requireAgenceAdmin, apiError } from '@/lib/api/auth'
import { isClosedDossier } from '@/lib/agence/constants'

export const dynamic = 'force-dynamic'

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : 0
}

/** input none / output { pipelineActif, commissionsARecevoir, commissionsRecues30j, dossiersActifs, recents } / rôle admin */
export async function GET() {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().slice(0, 10)

    const [dossiersRes, aRecevoirRes, recuesRes] = await Promise.all([
      supabase
        .from('dossiers')
        .select(`
          id, numero, phase, etiquette, type_transaction, montant_pret,
          commission_brute, created_at, clients(nom)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('commissions')
        .select('montant')
        .eq('company_id', companyId)
        .eq('statut', 'a_recevoir'),
      supabase
        .from('commissions')
        .select('montant')
        .eq('company_id', companyId)
        .eq('statut', 'recu')
        .gte('date_recue', sinceStr),
    ])

    if (dossiersRes.error) throw dossiersRes.error
    if (aRecevoirRes.error) throw aRecevoirRes.error
    if (recuesRes.error) throw recuesRes.error

    const dossiers = dossiersRes.data ?? []
    const actifs = dossiers.filter(d => !isClosedDossier(d.phase, d.etiquette))

    const pipelineActif = actifs.reduce((s, d) => s + toNumber(d.montant_pret), 0)
    const commissionsARecevoir = (aRecevoirRes.data ?? []).reduce((s, c) => s + toNumber(c.montant), 0)
    const commissionsRecues30j = (recuesRes.data ?? []).reduce((s, c) => s + toNumber(c.montant), 0)

    return NextResponse.json({
      pipelineActif,
      commissionsARecevoir,
      commissionsRecues30j,
      dossiersActifs: actifs.length,
      recents: dossiers.slice(0, 8),
    })
  } catch (err) {
    return apiError(err, '[GET /api/agence/kpis]')
  }
}
