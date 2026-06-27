import { NextRequest, NextResponse } from 'next/server'
import { createNote, deleteNote, getNotesByClient, getNotesByJob } from '@/lib/api/notes'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')
    const jobId    = searchParams.get('job_id')

    if (clientId) {
      const notes = await getNotesByClient(clientId)
      return NextResponse.json(notes)
    }
    if (jobId) {
      const notes = await getNotesByJob(jobId)
      return NextResponse.json(notes)
    }
    return NextResponse.json({ error: 'client_id ou job_id requis' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
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
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
    await deleteNote(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
