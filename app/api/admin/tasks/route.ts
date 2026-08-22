import { NextRequest, NextResponse } from 'next/server'
import { requirePlatformAdmin, apiError } from '@/lib/api/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUTS = new Set(['a_faire', 'en_cours', 'fait', 'annule'])
const PRIORITES = new Set(['basse', 'normale', 'haute', 'urgente'])

/** input none / output PlatformTask[] / rôle fondateur */
export async function GET() {
  try {
    await requirePlatformAdmin()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    return apiError(err, '[GET /api/admin/tasks]')
  }
}

/** input { titre, notes?, statut?, priorite?, due_date?, lead_id? } / output task / rôle fondateur */
export async function POST(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const body = await req.json()
    const admin = createAdminClient()

    const rawTasks = Array.isArray(body) ? body : (Array.isArray(body.tasks) ? body.tasks : [body])
    const toInsert = []

    for (const item of rawTasks) {
      const titre = typeof item.titre === 'string' ? item.titre.trim() : ''
      if (!titre) continue

      const statut = STATUTS.has(item.statut) ? item.statut : 'a_faire'
      const priorite = PRIORITES.has(item.priorite) ? item.priorite : 'normale'

      toInsert.push({
        titre,
        notes: item.notes?.trim() || null,
        statut,
        priorite,
        due_date: item.due_date || null,
        lead_id: item.lead_id || null,
        assigned_to: typeof item.assigned_to === 'string' && item.assigned_to.trim() ? item.assigned_to.trim() : null,
      })
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ error: 'Aucune tâche valide fournie' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('platform_tasks')
      .insert(toInsert)
      .select()

    if (error) throw error
    return NextResponse.json(Array.isArray(body) || Array.isArray(body.tasks) ? data : data[0], { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/admin/tasks]')
  }
}

/** input { id, ...fields } / output task / rôle fondateur */
export async function PATCH(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (body.titre !== undefined) {
      const titre = String(body.titre).trim()
      if (!titre) return NextResponse.json({ error: 'Titre requis' }, { status: 400 })
      updates.titre = titre
    }
    if (body.notes !== undefined) updates.notes = body.notes === '' ? null : body.notes
    if (body.statut !== undefined) {
      if (!STATUTS.has(body.statut)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
      updates.statut = body.statut
    }
    if (body.priorite !== undefined) {
      if (!PRIORITES.has(body.priorite)) return NextResponse.json({ error: 'Priorité invalide' }, { status: 400 })
      updates.priorite = body.priorite
    }
    if (body.due_date !== undefined) updates.due_date = body.due_date || null
    if (body.lead_id !== undefined) updates.lead_id = body.lead_id || null
    if (body.assigned_to !== undefined) updates.assigned_to = typeof body.assigned_to === 'string' && body.assigned_to.trim() ? body.assigned_to.trim() : null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_tasks')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    return apiError(err, '[PATCH /api/admin/tasks]')
  }
}

/** input ?id= / output { success } / rôle fondateur */
export async function DELETE(req: NextRequest) {
  try {
    await requirePlatformAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('platform_tasks')
      .delete()
      .eq('id', id)
      .select('id')
    if (error) throw error
    if (!data?.length) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/admin/tasks]')
  }
}
