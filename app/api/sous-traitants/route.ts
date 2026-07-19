import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// GET /api/sous-traitants — Liste des sous-traitants
export async function GET() {
  try {
    const { supabase, companyId } = await requireCompany()
    const { data, error } = await supabase
      .from('sous_traitants')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/sous-traitants]')
  }
}

// POST /api/sous-traitants — Créer un sous-traitant
export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const body = await req.json()

    if (!body.nom) {
      return NextResponse.json({ error: 'Le nom du sous-traitant est requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sous_traitants')
      .insert({
        company_id: companyId,
        nom: body.nom,
        entreprise: body.entreprise || null,
        telephone: body.telephone || null,
        email: body.email || null,
        rbq_no: body.rbq_no || null,
        tps_no: body.tps_no || null,
        tvq_no: body.tvq_no || null,
        specialite: body.specialite || 'général',
        statut: body.statut || 'actif',
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/sous-traitants]')
  }
}
