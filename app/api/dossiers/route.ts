import { NextRequest, NextResponse } from 'next/server'
import { requireAgenceAccess, apiError } from '@/lib/api/auth'
import { getAssignedDossierIds, isCompanyAdmin } from '@/lib/auth/permissions'
import { requireDossierAccess } from '@/lib/agence/access'
import { buildDossierPatch } from '@/lib/agence/constants'
import { estimateCommission, withEstimatedCommission } from '@/lib/agence/commission'

export const dynamic = 'force-dynamic'

const DOSSIER_LIST_SELECT = `
  id, company_id, client_id, preteur_id, assigned_to, numero, phase, etiquette,
  type_transaction, montant_pret, taux, taux_commission, commission_brute,
  date_soumission, date_approbation, date_notariat, date_cloture, notes,
  created_at, updated_at,
  clients(nom),
  preteurs(nom)
`

/** input none / output Dossier[] / rôle company */
export async function GET() {
  try {
    const { supabase, companyId, user, role } = await requireAgenceAccess()

    let query = supabase
      .from('dossiers')
      .select(DOSSIER_LIST_SELECT)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (!isCompanyAdmin(role)) {
      const assignedIds = await getAssignedDossierIds(supabase, user.id, companyId)
      if (assignedIds === null) {
        return NextResponse.json([])
      }
      if (assignedIds.length === 0) {
        return NextResponse.json([])
      }
      query = query.in('id', assignedIds)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/dossiers]')
  }
}

/** input { client_nom?, client_id?, type_transaction?, montant_pret?, phase?, notes?, preteur_id? } / output Dossier / rôle company */
export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAccess()

    const body = await req.json()
    const clientNom = typeof body.client_nom === 'string' ? body.client_nom.trim() : ''

    let client_id: string | null = body.client_id || null
    if (client_id) {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('id', client_id)
        .eq('company_id', companyId)
        .maybeSingle()
      if (!existingClient) {
        return NextResponse.json({ error: 'Client introuvable' }, { status: 400 })
      }
      client_id = existingClient.id
    } else if (clientNom) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('company_id', companyId)
        .ilike('nom', clientNom)
        .limit(1)
        .maybeSingle()

      if (existing) {
        client_id = existing.id
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({ company_id: companyId, nom: clientNom })
          .select('id')
          .single()
        if (clientErr) throw clientErr
        client_id = newClient?.id || null
      }
    }

    let preteur_id: string | null = body.preteur_id || null
    if (preteur_id) {
      const { data: existingPreteur } = await supabase
        .from('preteurs')
        .select('id')
        .eq('id', preteur_id)
        .eq('company_id', companyId)
        .maybeSingle()
      if (!existingPreteur) {
        return NextResponse.json({ error: 'Prêteur introuvable' }, { status: 400 })
      }
      preteur_id = existingPreteur.id
    }

    const montant_pret = body.montant_pret === '' || body.montant_pret == null
      ? null
      : parseFloat(body.montant_pret)
    const taux_commission = body.taux_commission === '' || body.taux_commission == null
      ? null
      : parseFloat(body.taux_commission)

    if (montant_pret != null && Number.isNaN(montant_pret)) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    }
    if (taux_commission != null && Number.isNaN(taux_commission)) {
      return NextResponse.json({ error: 'Taux de commission invalide' }, { status: 400 })
    }

    const commission_brute = estimateCommission(montant_pret, taux_commission)

    const { data, error } = await supabase
      .from('dossiers')
      .insert({
        company_id: companyId,
        client_id,
        preteur_id,
        numero: '',
        phase: body.phase || 'prise_en_charge',
        etiquette: 'nouveau_lead',
        type_transaction: body.type_transaction || 'achat',
        montant_pret,
        taux_commission,
        commission_brute,
        notes: body.notes || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/dossiers]')
  }
}

/** input { id, whitelist fields } / output Dossier / rôle company (collab si assigné) */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { supabase, companyId, dossier } = await requireDossierAccess(body.id)

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
      .eq('id', body.id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/dossiers]')
  }
}
