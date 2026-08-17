import { NextRequest, NextResponse } from 'next/server'
import { requireAgenceAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

const COMMISSION_PATCH_FIELDS = [
  'montant', 'statut', 'date_prevue', 'date_recue', 'notes', 'dossier_id', 'preteur_id',
] as const

/** input none / output Commission[] / rôle admin */
export async function GET() {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const { data, error } = await supabase
      .from('commissions')
      .select(`
        id, company_id, dossier_id, preteur_id, montant, statut,
        date_prevue, date_recue, notes, created_at,
        dossiers(numero, clients(nom)),
        preteurs(nom)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    return apiError(err, '[GET /api/commissions]')
  }
}

/** input { montant, dossier_id?, preteur_id?, statut?, date_prevue?, notes? } / output Commission / rôle admin */
export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const body = await req.json()
    const montant = parseFloat(body.montant)
    if (Number.isNaN(montant)) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })

    let preteur_id: string | null = body.preteur_id || null
    const dossier_id: string | null = body.dossier_id || null

    if (!preteur_id && dossier_id) {
      const { data: dossier } = await supabase
        .from('dossiers')
        .select('preteur_id')
        .eq('id', dossier_id)
        .eq('company_id', companyId)
        .maybeSingle()
      preteur_id = dossier?.preteur_id ?? null
    }

    const { data, error } = await supabase
      .from('commissions')
      .insert({
        company_id:  companyId,
        dossier_id,
        preteur_id,
        montant,
        statut:      body.statut      || 'a_recevoir',
        date_prevue: body.date_prevue || null,
        date_recue:  body.date_recue  || null,
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

/** input { id, ...fields } / output Commission / rôle admin */
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    for (const key of COMMISSION_PATCH_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key]
    }
    if (updates.montant !== undefined) {
      const montant = parseFloat(String(updates.montant))
      if (Number.isNaN(montant)) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
      updates.montant = montant
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('commissions')
      .update(updates)
      .eq('id', body.id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/commissions]')
  }
}

/** input ?id= / output { success } / rôle admin */
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id')

    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Commission introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/commissions]')
  }
}
