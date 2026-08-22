import { createClient } from './supabase-server'

export interface ClientListItem {
  id: string
  nom: string
  entreprise?: string | null
  email?: string | null
  telephone?: string | null
  ville?: string | null
  created_at: string
}

export interface PaginatedClients {
  data: ClientListItem[]
  total: number
  page: number
  pageSize: number
}

export async function getClients(page = 1, pageSize = 50): Promise<PaginatedClients> {
  const supabase = createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('clients')
    .select('id, nom, entreprise, email, telephone, ville, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[getClients]', error)
    return { data: [], total: 0, page, pageSize }
  }

  return {
    data: (data ?? []) as ClientListItem[],
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function getClient(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*, jobs(*), devis(*), factures(*)')
    .eq('id', id)
    .single()

  if (error) { console.error('[getClient]', error); return null }
  return data
}

export async function createClientRecord(payload: {
  nom: string; email?: string; telephone?: string
  adresse?: string; ville?: string; code_postal?: string; notes?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()

  const { data, error } = await supabase
    .from('clients')
    .insert({ ...payload, company_id: profile?.company_id })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
