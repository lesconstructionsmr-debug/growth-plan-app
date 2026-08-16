import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { calcRetenueGarantie } from '@/lib/qc/conformite'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const jobId = new URL(req.url).searchParams.get('job_id')

    let query = supabase
      .from('qc_retenues')
      .select('*, jobs(titre), sous_traitants(nom, entreprise)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (jobId) query = query.eq('job_id', jobId)

    const { data, error } = await query.limit(200)
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/qc/retenues]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const body = await req.json()

    if (!body.job_id || !body.description?.trim() || body.facture_montant == null) {
      return NextResponse.json({ error: 'job_id, description et facture_montant requis' }, { status: 400 })
    }

    const factureMontant = Number(body.facture_montant)
    const taux = body.taux_retenue != null ? Number(body.taux_retenue) : 0.10
    const { montantRetenu } = calcRetenueGarantie(factureMontant, taux)

    const { data, error } = await supabase
      .from('qc_retenues')
      .insert({
        company_id: companyId,
        job_id: body.job_id,
        sous_traitant_id: body.sous_traitant_id ?? null,
        description: body.description.trim(),
        facture_montant: factureMontant,
        taux_retenue: taux,
        montant_retenu: montantRetenu,
        statut: 'active',
        date_echeance: body.date_echeance ?? null,
        notes: body.notes ?? null,
      })
      .select('*, jobs(titre), sous_traitants(nom, entreprise)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/qc/retenues]')
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (body.statut) updates.statut = body.statut
    if (body.date_liberation) updates.date_liberation = body.date_liberation
    if (body.montant_paye != null) updates.montant_paye = Number(body.montant_paye)
    if (body.notes != null) updates.notes = body.notes

    const { data, error } = await supabase
      .from('qc_retenues')
      .update(updates)
      .eq('id', body.id)
      .eq('company_id', companyId)
      .select('*, jobs(titre), sous_traitants(nom, entreprise)')
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/qc/retenues]')
  }
}
