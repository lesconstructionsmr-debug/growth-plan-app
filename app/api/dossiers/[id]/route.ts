import { NextRequest, NextResponse } from 'next/server'
import { requireAgenceAdmin, apiError } from '@/lib/api/auth'
import { requireDossierAccess } from '@/lib/agence/access'
import { buildDossierPatch } from '@/lib/agence/constants'
import { withEstimatedCommission } from '@/lib/agence/commission'

export const dynamic = 'force-dynamic'

/** input params.id / output Dossier + client + prêteur + commissions / rôle company (collab si assigné) */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireDossierAccess(params.id)

    const { data, error } = await supabase
      .from('dossiers')
      .select(`
        id, company_id, client_id, preteur_id, assigned_to, numero, phase, etiquette,
        type_transaction, montant_pret, taux, taux_commission, commission_brute,
        date_soumission, date_approbation, date_notariat, date_cloture, notes,
        created_at, updated_at,
        clients(*),
        preteurs(*),
        commissions(*)
      `)
      .eq('id', params.id)
      .eq('company_id', companyId)
      .maybeSingle()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[GET /api/dossiers/[id]]')
  }
}

/** input whitelist fields / output Dossier / rôle company (collab si assigné) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId, dossier } = await requireDossierAccess(params.id)
    const body = await req.json()

    const patch = withEstimatedCommission(
      buildDossierPatch(body),
      { montant_pret: dossier.montant_pret, taux_commission: dossier.taux_commission },
    )
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dossiers')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/dossiers/[id]]')
  }
}

/** input params.id / output { success } / rôle admin */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const { data, error } = await supabase
      .from('dossiers')
      .delete()
      .eq('id', params.id)
      .eq('company_id', companyId)
      .select('id')

    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/dossiers/[id]]')
  }
}
