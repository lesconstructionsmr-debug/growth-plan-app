import { createClient } from './supabase-server'
import { requireCompany, ApiError } from './auth'

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
  const { supabase, user, companyId } = await requireCompany()

  const { data, error } = await supabase
    .from('notes')
    .insert({
      company_id: companyId,
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
  const { supabase, companyId } = await requireCompany()
  // .select('id') = vérifier les lignes réellement supprimées — sans ça, RLS peut
  // bloquer silencieusement et on renverrait un faux succès (S2.2)
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
    .select('id')
  if (error) throw error
  if (!data?.length) throw new ApiError(404, 'Note introuvable')
}
