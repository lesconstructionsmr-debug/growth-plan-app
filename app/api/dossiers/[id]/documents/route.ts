import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/auth'
import { requireDossierAccess } from '@/lib/agence/access'
import { DOCUMENT_TYPE_IDS } from '@/lib/agence/constants'

export const dynamic = 'force-dynamic'

/** input params.id / output DossierDocument[] / rôle company (collab si assigné) */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireDossierAccess(params.id)
    const { data, error } = await supabase
      .from('dossier_documents')
      .select('*')
      .eq('company_id', companyId)
      .eq('dossier_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/dossiers/[id]/documents]')
  }
}

/** input { type?, titre, recu?, file_url?, notes? } / output DossierDocument / rôle company (collab si assigné) */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireDossierAccess(params.id)
    const body = await req.json()

    if (!body.titre?.trim()) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
    }

    const rawType = typeof body.type === 'string' ? body.type : ''
    const type = (DOCUMENT_TYPE_IDS as readonly string[]).includes(rawType) ? rawType : 'autre'

    const { data, error } = await supabase
      .from('dossier_documents')
      .insert({
        company_id: companyId,
        dossier_id: params.id,
        type,
        titre: body.titre.trim(),
        recu: typeof body.recu === 'boolean' ? body.recu : false,
        file_url: body.file_url?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/dossiers/[id]/documents]')
  }
}

/** input { id, recu?, titre?, notes?, file_url? } / output DossierDocument / rôle company (collab si assigné) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireDossierAccess(params.id)
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (typeof body.recu === 'boolean') updates.recu = body.recu
    if (body.titre !== undefined) {
      const titre = typeof body.titre === 'string' ? body.titre.trim() : ''
      if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
      updates.titre = titre
    }
    if (body.notes !== undefined) updates.notes = body.notes === '' ? null : body.notes
    if (body.file_url !== undefined) updates.file_url = body.file_url === '' ? null : body.file_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('dossier_documents')
      .update(updates)
      .eq('id', body.id)
      .eq('dossier_id', params.id)
      .eq('company_id', companyId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/dossiers/[id]/documents]')
  }
}

/** input ?id= / output { success } / rôle company (collab si assigné) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId } = await requireDossierAccess(params.id)
    const docId = new URL(req.url).searchParams.get('id')
    if (!docId) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const { data, error } = await supabase
      .from('dossier_documents')
      .delete()
      .eq('id', docId)
      .eq('dossier_id', params.id)
      .eq('company_id', companyId)
      .select('id')

    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/dossiers/[id]/documents]')
  }
}
