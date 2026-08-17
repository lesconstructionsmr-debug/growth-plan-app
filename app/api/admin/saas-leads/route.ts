import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUTS = new Set(['nouveau', 'contacte', 'qualifie', 'essai', 'client', 'perdu'])
const BESOINS = new Set(['structure_numerique', 'optimisation', 'les_deux', 'autre'])

function scoreFromAnswers(besoin?: string, taille?: string): number {
  let p = 20
  if (besoin === 'structure_numerique') p += 25
  if (besoin === 'optimisation') p += 25
  if (besoin === 'les_deux') p += 40
  if (taille === '2-5') p += 15
  if (taille === '6-15') p += 25
  if (taille === '16+') p += 30
  if (taille === 'solo') p += 10
  return Math.min(100, p)
}

/** input none / output PlatformLead[] / rôle fondateur */
export async function GET() {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_leads')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/admin/saas-leads]')
  }
}

/** input { nom, email?, telephone?, entreprise?, source?, besoin?, taille_equipe?, notes? } */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const body = await req.json()
    const nom = typeof body.nom === 'string' ? body.nom.trim() : ''
    if (!nom) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

    const besoin = BESOINS.has(body.besoin) ? body.besoin : null
    const taille = typeof body.taille_equipe === 'string' ? body.taille_equipe : null
    const score = scoreFromAnswers(besoin ?? undefined, taille ?? undefined)

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_leads')
      .insert({
        nom,
        email: body.email?.trim() || null,
        telephone: body.telephone?.trim() || null,
        entreprise: body.entreprise?.trim() || null,
        source: body.source?.trim() || 'manuel',
        statut: STATUTS.has(body.statut) ? body.statut : 'nouveau',
        besoin,
        taille_equipe: taille,
        score,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/admin/saas-leads]')
  }
}

/** input { id, ...fields } */
export async function PATCH(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    for (const key of ['nom', 'email', 'telephone', 'entreprise', 'source', 'notes', 'taille_equipe'] as const) {
      if (body[key] !== undefined) updates[key] = body[key] === '' ? null : body[key]
    }
    if (body.statut !== undefined) {
      if (!STATUTS.has(body.statut)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
      updates.statut = body.statut
    }
    if (body.besoin !== undefined) {
      updates.besoin = BESOINS.has(body.besoin) ? body.besoin : null
    }
    if (body.besoin !== undefined || body.taille_equipe !== undefined) {
      updates.score = scoreFromAnswers(
        (updates.besoin as string) ?? body.besoin,
        (updates.taille_equipe as string) ?? body.taille_equipe,
      )
    }
    if (body.score !== undefined) updates.score = body.score

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_leads')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/admin/saas-leads]')
  }
}

/** input ?id= */
export async function DELETE(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    const admin = createAdminClient()
    const { data, error } = await admin.from('platform_leads').delete().eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/admin/saas-leads]')
  }
}
