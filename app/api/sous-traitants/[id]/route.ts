import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

// DELETE /api/sous-traitants/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, companyId } = await requireCompany()
    const { error } = await supabase
      .from('sous_traitants')
      .delete()
      .eq('id', params.id)
      .eq('company_id', companyId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/sous-traitants/[id]]')
  }
}

// PUT /api/sous-traitants/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, companyId } = await requireCompany()
    const body = await req.json()

    const { data, error } = await supabase
      .from('sous_traitants')
      .update({
        nom: body.nom,
        entreprise: body.entreprise,
        telephone: body.telephone,
        email: body.email,
        rbq_no: body.rbq_no,
        tps_no: body.tps_no,
        tvq_no: body.tvq_no,
        specialite: body.specialite,
        statut: body.statut,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PUT /api/sous-traitants/[id]]')
  }
}
