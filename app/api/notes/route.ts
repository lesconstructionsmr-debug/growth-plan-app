import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, requireCompanyAdmin, apiError } from '@/lib/api/auth'
import { createNote, deleteNote, getNotesByClient, getNotesByJob } from '@/lib/api/notes'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireCompany()
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')
    const jobId    = searchParams.get('job_id')

    if (clientId) return NextResponse.json(await getNotesByClient(clientId))
    if (jobId)    return NextResponse.json(await getNotesByJob(jobId))
    return NextResponse.json({ error: 'client_id ou job_id requis' }, { status: 400 })
  } catch (err) {
    return apiError(err, '[GET /api/notes]')
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireCompanyAdmin()
    const body = await req.json()
    if (!body.contenu?.trim()) {
      return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
    }
    const note = await createNote({
      client_id: body.client_id,
      job_id:    body.job_id,
      type:      body.type ?? 'note',
      contenu:   body.contenu.trim(),
    })
    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    return apiError(err, '[POST /api/notes]')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireCompanyAdmin()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
    await deleteNote(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err, '[DELETE /api/notes]')
  }
}
