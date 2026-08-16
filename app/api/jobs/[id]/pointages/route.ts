import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/auth'
import { requireJobAccess } from '@/lib/api/job-access'
import { isCompanyAdmin } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

function calcDureeMinutes(debut: string, fin: string): number {
  const [dh, dm] = debut.split(':').map(Number)
  const [fh, fm] = fin.split(':').map(Number)
  return Math.max(0, (fh * 60 + fm) - (dh * 60 + dm))
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireJobAccess(params.id)
    const { data, error } = await supabase
      .from('pointages')
      .select('*, profiles(full_name)')
      .eq('company_id', companyId)
      .eq('job_id', params.id)
      .order('date', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/jobs/[id]/pointages]')
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId, user } = await requireJobAccess(params.id)
    const body = await req.json()

    if (!body.heure_debut) {
      return NextResponse.json({ error: 'heure_debut requis' }, { status: 400 })
    }

    const heureFin = body.heure_fin ?? null
    const duree = heureFin ? calcDureeMinutes(body.heure_debut, heureFin) : null

    const { data, error } = await supabase
      .from('pointages')
      .insert({
        company_id: companyId,
        job_id: params.id,
        profile_id: user.id,
        date: body.date ?? new Date().toISOString().split('T')[0],
        heure_debut: body.heure_debut,
        heure_fin: heureFin,
        duree_minutes: duree,
        dans_rayon_debut: body.dans_rayon_debut ?? true,
        dans_rayon_fin: body.dans_rayon_fin ?? true,
        notes: body.notes ?? null,
        approuve: false,
      })
      .select('*, profiles(full_name)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/jobs/[id]/pointages]')
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId, role } = await requireJobAccess(params.id)
    if (!isCompanyAdmin(role)) {
      return NextResponse.json({ error: 'Accès réservé aux propriétaires et administrateurs' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.pointage_id) {
      return NextResponse.json({ error: 'pointage_id requis' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof body.approuve === 'boolean') updates.approuve = body.approuve

    const { data, error } = await supabase
      .from('pointages')
      .update(updates)
      .eq('id', body.pointage_id)
      .eq('job_id', params.id)
      .eq('company_id', companyId)
      .select('*, profiles(full_name)')
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/jobs/[id]/pointages]')
  }
}
