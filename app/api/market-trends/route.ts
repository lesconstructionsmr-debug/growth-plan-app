import { NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Vérifier l'authentification (doit être un membre connecté de l'ERP)
    const { supabase } = await requireCompany()

    // Charger les indicateurs triés chronologiquement
    const { data, error } = await supabase
      .from('market_trends')
      .select('id, date_ref, indicateur, valeur, unite, categorie, region')
      .order('date_ref', { ascending: true })

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/market-trends]')
  }
}
