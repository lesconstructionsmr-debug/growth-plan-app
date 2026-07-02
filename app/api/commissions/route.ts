import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase } = await requireCompany()

    const { data, error } = await supabase
      .from('commissions')
      .select(`
        id, company_id, dossier_id, preteur_id, montant, statut,
        date_prevue, date_recue, notes, created_at,
        dossiers(numero, clients(nom)),
        preteurs(nom)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    return apiError(err, '[GET /api/commissions]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const body = await req.json()
    const montant = parseFloat(body.montant)
    if (Number.isNaN(montant)) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })

    const { data, error } = await supabase
      .from('commissions')
      .insert({
        company_id:  companyId,
        dossier_id:  body.dossier_id  || null,
        preteur_id:  body.preteur_id  || null,
        montant,
        statut:      body.statut      || 'a_recevoir',
        date_prevue: body.date_prevue || null,
        notes:       body.notes       || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/commissions]')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('commissions')
      .update(updates)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/commissions]')
  }
}
