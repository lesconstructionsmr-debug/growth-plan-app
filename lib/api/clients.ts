import { createClient } from './supabase-server'

export async function getClients() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('[getClients]', error); return [] }
  return data ?? []
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
