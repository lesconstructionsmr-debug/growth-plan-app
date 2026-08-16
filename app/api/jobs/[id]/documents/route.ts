import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/auth'
import { requireJobAccess } from '@/lib/api/job-access'
import { isCompanyAdmin } from '@/lib/auth/permissions'

export const dynamic = 'force-dynamic'

const DOC_TYPES = ['plan', 'photo', 'mesure', 'extra', 'document', 'autre'] as const

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireJobAccess(params.id)
    const { data, error } = await supabase
      .from('job_documents')
      .select('*')
      .eq('company_id', companyId)
      .eq('job_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/jobs/[id]/documents]')
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId, user, role } = await requireJobAccess(params.id)
    if (!isCompanyAdmin(role)) {
      return NextResponse.json({ error: 'Accès réservé aux propriétaires et administrateurs' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.titre?.trim()) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    }

    const type = DOC_TYPES.includes(body.type) ? body.type : 'document'

    const { data, error } = await supabase
      .from('job_documents')
      .insert({
        company_id: companyId,
        job_id: params.id,
        type,
        titre: body.titre.trim(),
        file_url: body.file_url?.trim() || null,
        mime_type: body.mime_type ?? null,
        file_size: body.file_size ?? null,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/jobs/[id]/documents]')
  }
}
