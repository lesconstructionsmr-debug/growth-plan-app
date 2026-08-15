import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { isCompanyAdmin, getAssignedJobIds } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase, companyId, user, role } = await requireCompany()

    let query = supabase
      .from('jobs')
      .select('*, clients(nom)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (!isCompanyAdmin(role)) {
      const assignedIds = await getAssignedJobIds(supabase, user.id, companyId)
      if (assignedIds === null) {
        // Table job_assignments absente — retour vide en attendant la migration
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
    return apiError(err, '[GET /api/jobs]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()

    const body = await req.json()
    if (!body.titre?.trim()) return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })

    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('jobs').select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
    const numero = `JOB-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        company_id:            companyId,
        client_id:             body.client_id,
        numero,
        titre:                 body.titre,
        description:           body.description ?? null,
        statut:                body.statut ?? 'en_attente',
        adresse_chantier:      body.adresse ?? null,
        ville_chantier:        body.ville ?? null,
        code_postal_chantier:  body.code_postal ?? null,
        rayon_pointage_metres: body.rayon_pointage_metres ?? 200,
        date_debut:            body.date_debut ?? null,
        date_fin_prevue:       body.date_fin_prevue ?? null,
        budget:                body.budget ?? null,
        couleur:               body.couleur ?? '#C9A84C',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/jobs]')
  }
}
