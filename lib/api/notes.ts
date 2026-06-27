import { createClient } from './supabase-server'

export type NoteType = 'note' | 'appel' | 'specification' | 'document' | 'rappel'

export interface Note {
  id: string
  company_id: string
  client_id: string | null
  job_id: string | null
  auteur_id: string | null
  type: NoteType
  contenu: string
  created_at: string
  profiles?: { full_name: string | null; avatar_url: string | null }
}

export async function getNotesByClient(clientId: string): Promise<Note[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, profiles(full_name, avatar_url)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) { console.error('[getNotesByClient]', error); return [] }
  return (data ?? []) as Note[]
}

export async function getNotesByJob(jobId: string): Promise<Note[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*, profiles(full_name, avatar_url)')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })

  if (error) { console.error('[getNotesByJob]', error); return [] }
  return (data ?? []) as Note[]
}

export async function createNote(payload: {
  client_id?: string
  job_id?: string
  type: NoteType
  contenu: string
}): Promise<Note> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()

  const { data, error } = await supabase
    .from('notes')
    .insert({
      company_id: profile?.company_id,
      client_id:  payload.client_id ?? null,
      job_id:     payload.job_id    ?? null,
      auteur_id:  user.id,
      type:       payload.type,
      contenu:    payload.contenu,
    })
    .select('*, profiles(full_name, avatar_url)')
    .single()

  if (error) throw error
  return data as Note
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
