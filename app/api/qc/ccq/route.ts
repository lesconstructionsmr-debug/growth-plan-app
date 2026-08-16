import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, requireCompanyAdmin, apiError } from '@/lib/api/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompany()
    const jobId = new URL(req.url).searchParams.get('job_id')

    let query = supabase
      .from('qc_ccq_entries')
      .select('*, jobs(titre), profiles(full_name)')
      .eq('company_id', companyId)
      .order('date', { ascending: false })

    if (jobId) query = query.eq('job_id', jobId)

    const { data, error } = await query.limit(200)
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/qc/ccq]')
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const body = await req.json()

    if (!body.job_id || !body.metier?.trim()) {
      return NextResponse.json({ error: 'job_id et metier requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('qc_ccq_entries')
      .insert({
        company_id: companyId,
        job_id: body.job_id,
        profile_id: body.profile_id ?? null,
        metier: body.metier.trim(),
        date: body.date ?? new Date().toISOString().split('T')[0],
        heures: Number(body.heures) || 0,
        notes: body.notes ?? null,
      })
      .select('*, jobs(titre), profiles(full_name)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/qc/ccq]')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, companyId } = await requireCompanyAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('qc_ccq_entries')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId)
      .select('id')

    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/qc/ccq]')
  }
}
