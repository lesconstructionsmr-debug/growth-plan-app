import { NextRequest, NextResponse } from 'next/server'
import { requireAgenceAccess, requireAgenceAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

const PRETEUR_PATCH_FIELDS = [
  'nom', 'type', 'contact_nom', 'contact_email', 'contact_tel', 'notes', 'actif',
] as const

/** input none / output Preteur[] / rôle company */
export async function GET() {
  try {
    const { supabase, companyId } = await requireAgenceAccess()

    const { data, error } = await supabase
      .from('preteurs')
      .select('*')
      .eq('company_id', companyId)
      .order('nom', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    return apiError(err, '[GET /api/preteurs]')
  }
}

/** input { nom, type?, contact_nom?, contact_email?, contact_tel?, notes? } / output Preteur / rôle admin */
export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const body = await req.json()
    if (!body.nom?.trim()) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('preteurs')
      .insert({
        company_id:    companyId,
        nom:           body.nom.trim(),
        type:          body.type          || 'banque',
        contact_nom:   body.contact_nom   || null,
        contact_email: body.contact_email || null,
        contact_tel:   body.contact_tel   || null,
        notes:         body.notes         || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/preteurs]')
  }
}

/** input { id, ...fields } / output Preteur / rôle admin */
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    for (const key of PRETEUR_PATCH_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key]
    }
    if (updates.nom != null && typeof updates.nom === 'string') {
      const nom = updates.nom.trim()
      if (!nom) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
      updates.nom = nom
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('preteurs')
      .update(updates)
      .eq('id', body.id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/preteurs]')
  }
}

/** input ?id= / output { success } / rôle admin */
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('preteurs')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id')

    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Prêteur introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/preteurs]')
  }
}
