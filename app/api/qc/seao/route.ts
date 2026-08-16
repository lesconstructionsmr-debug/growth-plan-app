import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, requireCompanyAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase, companyId } = await requireCompany()

    const { data, error } = await supabase
      .from('qc_seao_avis')
      .select('*, jobs(titre)')
      .eq('company_id', companyId)
      .order('date_cloture', { ascending: true, nullsFirst: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/qc/seao]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const body = await req.json()

    if (!body.numero_avis?.trim() || !body.titre?.trim()) {
      return NextResponse.json({ error: 'numero_avis et titre requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('qc_seao_avis')
      .insert({
        company_id: companyId,
        job_id: body.job_id ?? null,
        numero_avis: body.numero_avis.trim(),
        titre: body.titre.trim(),
        organisme: body.organisme ?? null,
        date_publication: body.date_publication ?? null,
        date_cloture: body.date_cloture ?? null,
        montant_estime: body.montant_estime != null ? Number(body.montant_estime) : null,
        statut: body.statut ?? 'a_soumettre',
        url: body.url ?? null,
        notes: body.notes ?? null,
      })
      .select('*, jobs(titre)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/qc/seao]')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    for (const key of ['statut', 'notes', 'url', 'job_id', 'date_cloture', 'montant_estime'] as const) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('qc_seao_avis')
      .update(updates)
      .eq('id', body.id)
      .eq('company_id', companyId)
      .select('*, jobs(titre)')
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/qc/seao]')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('qc_seao_avis')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id')

    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/qc/seao]')
  }
}
