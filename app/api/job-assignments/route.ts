import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, requireCompanyAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()

    const [assignmentsRes, profilesRes, jobsRes] = await Promise.all([
      supabase
        .from('job_assignments')
        .select('id, job_id, profile_id, created_at, jobs(id, titre, statut), profiles(id, full_name, role)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('company_id', companyId)
        .order('full_name'),
      supabase
        .from('jobs')
        .select('id, titre, statut, ville_chantier, date_debut')
        .eq('company_id', companyId)
        .order('titre'),
    ])

    if (profilesRes.error) throw profilesRes.error
    if (jobsRes.error) throw jobsRes.error

    const employees = (profilesRes.data ?? []).filter(p => {
      const r = (p.role ?? '').toLowerCase()
      return r !== 'owner' && r !== 'propriétaire' && r !== 'proprietaire'
    })

    return NextResponse.json({
      assignments: assignmentsRes.data ?? [],
      employees,
      jobs: jobsRes.data ?? [],
    })
  } catch (err) {
    return apiError(err, '[GET /api/job-assignments]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const body = await req.json()

    if (!body.job_id || !body.profile_id) {
      return NextResponse.json({ error: 'job_id et profile_id requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('job_assignments')
      .upsert(
        {
          company_id: companyId,
          job_id: body.job_id,
          profile_id: body.profile_id,
        },
        { onConflict: 'job_id,profile_id' },
      )
      .select('id, job_id, profile_id, created_at')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/job-assignments]')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const jobId = searchParams.get('job_id')
    const profileId = searchParams.get('profile_id')

    let query = supabase.from('job_assignments').delete().eq('company_id', companyId)

    if (id) {
      query = query.eq('id', id)
    } else if (jobId && profileId) {
      query = query.eq('job_id', jobId).eq('profile_id', profileId)
    } else {
      return NextResponse.json({ error: 'id ou job_id+profile_id requis' }, { status: 400 })
    }

    const { data, error } = await query.select('id')
    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Assignation introuvable' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/job-assignments]')
  }
}
