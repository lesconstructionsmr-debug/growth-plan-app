import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/leads/list
 *
 * Récupère les leads du CRM pour l'entreprise connectée (isolation stricte par company_id).
 */
export async function GET(_req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const { data: companyData, error: companyErr } = await supabase
      .from('leads')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (companyErr) {
      throw companyErr
    }

    const rawCompany = companyData ?? []

    const formatted = rawCompany.map((l: any) => ({
      id: l.id,
      nom: l.nom,
      entreprise: l.source || l.entreprise || undefined,
      telephone: l.telephone || undefined,
      email: l.email || undefined,
      montant_estime: l.valeur_estimee ? Number(l.valeur_estimee) : undefined,
      date_creation: l.created_at || new Date().toISOString(),
      statut: l.statut || 'nouveau',
      priorite: (l.priorite || 'normale') as 'basse' | 'normale' | 'haute',
      notes: l.notes || undefined,
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    return apiError(err, '[GET /api/leads/list]')
  }
}
