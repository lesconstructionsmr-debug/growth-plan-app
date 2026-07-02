import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase } = await requireCompany()

    const { data, error } = await supabase
      .from('preteurs')
      .select('*')
      .order('nom', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    return apiError(err, '[GET /api/preteurs]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const body = await req.json()
    if (!body.nom?.trim()) return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('preteurs')
      .insert({
        company_id:    companyId,
        nom:           body.nom,
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

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()

    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('preteurs')
      .update(updates)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/preteurs]')
  }
}
