import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    let query = supabase
      .from('calendar_events')
      .select('*, employes(nom), clients(nom)')
      .eq('company_id', companyId)
      .order('date', { ascending: true })
      .order('heure_debut', { ascending: true })

    if (start) query = query.gte('date', start)
    if (end) query = query.lte('date', end)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/calendar-events]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const body = await req.json()

    if (!body.titre?.trim()) return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    if (!body.date) return NextResponse.json({ error: 'La date est requise' }, { status: 400 })

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        company_id:  companyId,
        titre:       body.titre.trim(),
        type:        body.type ?? 'rdv',
        description: body.description?.trim() || null,
        date:        body.date,
        heure_debut: body.heure_debut || null,
        heure_fin:   body.heure_fin || null,
        client_id:   body.client_id || null,
        job_id:      body.job_id || null,
        employe_id:  body.employe_id || null,
        adresse:     body.adresse?.trim() || null,
        couleur:     body.couleur?.trim() || null,
        statut:      body.statut ?? 'planifie',
      })
      .select('*, employes(nom), clients(nom)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/calendar-events]')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const body = await req.json()

    if (!body.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    const allowed = ['titre', 'type', 'description', 'date', 'heure_debut', 'heure_fin', 'client_id', 'job_id', 'employe_id', 'adresse', 'couleur', 'statut']
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .update(updates)
      .eq('id', body.id)
      .eq('company_id', companyId)
      .select('*, employes(nom), clients(nom)')
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/calendar-events]')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/calendar-events]')
  }
}
