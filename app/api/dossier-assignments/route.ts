import { NextRequest, NextResponse } from 'next/server'
import { requireAgenceAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

/** input none / output { assignments, employees, dossiers } / rôle admin */
export async function GET() {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()

    const [assignmentsRes, profilesRes, dossiersRes] = await Promise.all([
      supabase
        .from('dossier_assignments')
        .select('id, dossier_id, profile_id, created_at, dossiers(id, numero, phase, etiquette), profiles(id, full_name, role)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('company_id', companyId)
        .order('full_name'),
      supabase
        .from('dossiers')
        .select('id, numero, phase, etiquette, type_transaction')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
    ])

    if (profilesRes.error) throw profilesRes.error
    if (dossiersRes.error) throw dossiersRes.error

    const employees = (profilesRes.data ?? []).filter(p => {
      const r = (p.role ?? '').toLowerCase()
      return r !== 'owner' && r !== 'propriétaire' && r !== 'proprietaire'
    })

    return NextResponse.json({
      assignments: assignmentsRes.data ?? [],
      employees,
      dossiers: dossiersRes.data ?? [],
    })
  } catch (err) {
    return apiError(err, '[GET /api/dossier-assignments]')
  }
}

/** input { dossier_id, profile_id } / output assignment / rôle admin */
export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()
    const body = await req.json()

    if (!body.dossier_id || !body.profile_id) {
      return NextResponse.json({ error: 'dossier_id et profile_id requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dossier_assignments')
      .upsert(
        {
          company_id: companyId,
          dossier_id: body.dossier_id,
          profile_id: body.profile_id,
        },
        { onConflict: 'dossier_id,profile_id' },
      )
      .select('id, dossier_id, profile_id, created_at')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/dossier-assignments]')
  }
}

/** input ?id= ou ?dossier_id=&profile_id= / output { success } / rôle admin */
export async function DELETE(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireAgenceAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const dossierId = searchParams.get('dossier_id')
    const profileId = searchParams.get('profile_id')

    let query = supabase.from('dossier_assignments').delete().eq('company_id', companyId)

    if (id) {
      query = query.eq('id', id)
    } else if (dossierId && profileId) {
      query = query.eq('dossier_id', dossierId).eq('profile_id', profileId)
    } else {
      return NextResponse.json({ error: 'id ou dossier_id+profile_id requis' }, { status: 400 })
    }

    const { data, error } = await query.select('id')
    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Assignation introuvable' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/dossier-assignments]')
  }
}
